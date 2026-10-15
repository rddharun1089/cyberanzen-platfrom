#!/usr/bin/env bash
# Start Enigmatrix Platform Server
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo "   STARTING ENIGMATRIX CRIME INVESTIGATION PLATFORM SERVER       "
echo "================================================================="

# Check virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r backend/requirements.txt
fi

# Bootstrap database if not present
if [ ! -f "cyberanzen.db" ]; then
    echo "Bootstrapping database with 80 cases..."
    PYTHONPATH=backend ./venv/bin/python backend/app/db/init_db.py
fi

# Build frontend if dist not present
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

echo "Starting server on http://0.0.0.0:8000 ..."
PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
