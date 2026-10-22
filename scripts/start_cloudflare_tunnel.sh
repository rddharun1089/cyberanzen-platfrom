#!/usr/bin/env bash
# ==============================================================================
# Cloudflare Tunnel Host Launcher for Enigmatrix Platform
# Opens a secure public HTTPS URL directly to your local instance.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "======================================================================"
echo "      ENIGMATRIX — CLOUDFLARE TUNNEL PUBLIC HOSTING LAUNCHER"
echo "======================================================================"

# 1. Check if backend is running on port 8000
if ! curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo "[*] Backend server is not running on port 8000. Starting it..."
    PYTHONPATH=backend "$DIR/venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8000 &
    sleep 3
fi

# 2. Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "[!] cloudflared is not found in PATH."
    exit 1
fi

echo "[✓] Local backend is active at http://127.0.0.1:8000"
echo "[*] Initializing Cloudflare Tunnel..."
echo "[*] If you have a Cloudflare Token, you can run: cloudflared tunnel run --token <YOUR_TOKEN>"
echo "[*] Starting Cloudflare Quick Tunnel (Free public HTTPS URL)..."
echo "======================================================================"

exec cloudflared tunnel --url http://127.0.0.1:8000
