#!/usr/bin/env bash
# Push CyberAnzen repository to a remote Git provider (GitHub / GitLab / Gitea)
set -e

REMOTE_URL="$1"

if [ -z "$REMOTE_URL" ]; then
    echo "Usage: $0 <git-remote-url>"
    echo "Example: $0 https://github.com/your-username/cyberanzen-platform.git"
    echo "Example (with token): $0 https://<TOKEN>@github.com/your-username/cyberanzen-platform.git"
    echo "Example (SSH): $0 git@github.com:your-username/cyberanzen-platform.git"
    exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "Configuring remote origin to: $REMOTE_URL"
if git remote | grep -q "^origin$"; then
    git remote set-url origin "$REMOTE_URL"
else
    git remote add origin "$REMOTE_URL"
fi

echo "Pushing branch 'main' to origin..."
git push -u origin main

echo "Successfully uploaded to Git remote!"
