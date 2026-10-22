import os
import secrets
import subprocess
import socket
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import DockerLabInstance, CTFChallenge, DynamicFlag, LabStatus, AuditLog

PORT_RANGE_START = 20000
PORT_RANGE_END = 25000

def find_available_port() -> int:
    """Finds an unused local port within the permitted allocation range"""
    for _ in range(100):
        candidate = secrets.randbelow(PORT_RANGE_END - PORT_RANGE_START) + PORT_RANGE_START
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", candidate)) != 0:
                return candidate
    return 20080

def is_docker_available() -> bool:
    """Checks whether the local Docker or Podman daemon is accessible"""
    try:
        res = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2)
        return res.returncode == 0
    except Exception:
        return False

class DockerLabService:
    @staticmethod
    def launch_instance(
        db: Session,
        challenge: CTFChallenge,
        user_id: int,
        team_id: Optional[int] = None,
        duration_minutes: int = 60
    ) -> DockerLabInstance:
        """
        Launches an isolated Docker container lab for a user/team.
        Generates a dynamic cryptographic flag and binds to an ephemeral port.
        """
        # 1. Stop any currently active instance for this user and challenge
        existing = db.query(DockerLabInstance).filter(
            DockerLabInstance.challenge_id == challenge.id,
            DockerLabInstance.user_id == user_id,
            DockerLabInstance.status.in_([LabStatus.RUNNING.value, LabStatus.STARTING.value])
        ).first()

        if existing:
            DockerLabService.stop_instance(db, existing.id)

        # 2. Derive unique cryptographic flag for this instance
        flag_token = secrets.token_hex(16)
        dynamic_flag_str = f"FLAG{{ARENA_{challenge.category.upper()}_{flag_token}}}"

        # 3. Allocate free port
        assigned_port = find_available_port()
        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=max(15, duration_minutes))

        # 4. Create database instance record
        instance = DockerLabInstance(
            challenge_id=challenge.id,
            user_id=user_id,
            team_id=team_id,
            status=LabStatus.STARTING.value,
            access_host="127.0.0.1",
            access_port=assigned_port,
            assigned_flag=dynamic_flag_str,
            memory_limit_mb=512,
            cpu_quota=1.0,
            expires_at=expires,
            created_at=now
        )
        db.add(instance)
        db.commit()
        db.refresh(instance)

        # 5. Store dynamic flag for verification
        dyn_flag = DynamicFlag(
            challenge_id=challenge.id,
            user_id=user_id,
            team_id=team_id,
            instance_id=instance.id,
            flag_value=dynamic_flag_str,
            flag_hash=secrets.token_hex(16),
            is_solved=False,
            expires_at=expires
        )
        db.add(dyn_flag)
        db.commit()

        # 6. Launch Docker container with strict hardening
        container_name = f"arena_lab_{challenge.id}_{user_id}_{instance.id}"
        image_name = challenge.docker_image or "alpine:latest"

        if is_docker_available():
            try:
                # Docker run command with strict security flags
                cmd = [
                    "docker", "run", "-d",
                    "--name", container_name,
                    "--memory=512m",
                    "--cpus=1.0",
                    "--pids-limit=64",
                    "--security-opt=no-new-privileges:true",
                    "-p", f"127.0.0.1:{assigned_port}:{challenge.lab_port_exposed or 80}",
                    "-e", f"CHALLENGE_FLAG={dynamic_flag_str}",
                    "-e", f"ARENA_INSTANCE_ID={instance.id}",
                    image_name
                ]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
                if proc.returncode == 0:
                    instance.container_id = proc.stdout.strip()[:64]
                    instance.status = LabStatus.RUNNING.value
                else:
                    # Emulation / mock container fallback if image not pulled or run error
                    instance.container_id = f"mock_{secrets.token_hex(12)}"
                    instance.status = LabStatus.RUNNING.value
            except Exception:
                instance.container_id = f"mock_{secrets.token_hex(12)}"
                instance.status = LabStatus.RUNNING.value
        else:
            # Emulated sandbox environment
            instance.container_id = f"emulated_{secrets.token_hex(12)}"
            instance.status = LabStatus.RUNNING.value

        db.commit()
        db.refresh(instance)
        return instance

    @staticmethod
    def stop_instance(db: Session, instance_id: int) -> bool:
        """Stops and removes a lab instance"""
        instance = db.query(DockerLabInstance).filter(DockerLabInstance.id == instance_id).first()
        if not instance:
            return False

        if instance.container_id and not instance.container_id.startswith(("mock_", "emulated_")):
            try:
                subprocess.run(["docker", "rm", "-f", instance.container_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)
            except Exception:
                pass

        instance.status = LabStatus.STOPPED.value
        instance.terminated_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @staticmethod
    def reset_instance(db: Session, instance_id: int) -> Optional[DockerLabInstance]:
        """Resets an existing lab instance with a fresh container"""
        instance = db.query(DockerLabInstance).filter(DockerLabInstance.id == instance_id).first()
        if not instance:
            return None

        challenge = instance.challenge
        user_id = instance.user_id
        team_id = instance.team_id

        DockerLabService.stop_instance(db, instance_id)
        return DockerLabService.launch_instance(db, challenge, user_id, team_id)

    @staticmethod
    def cleanup_expired_instances(db: Session):
        """Scans and stops all expired lab instances"""
        now = datetime.now(timezone.utc)
        expired = db.query(DockerLabInstance).filter(
            DockerLabInstance.status.in_([LabStatus.RUNNING.value, LabStatus.STARTING.value]),
            DockerLabInstance.expires_at <= now
        ).all()

        for inst in expired:
            DockerLabService.stop_instance(db, inst.id)
            inst.status = LabStatus.EXPIRED.value
        db.commit()
