#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "============================================================"
echo "⚡ STARTING ZEROTRACE ENTERPRISE PLATFORM STACK"
echo "============================================================"

# Trap to kill background processes on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping all ZeroTrace services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Hardhat Node
echo "▶ [1/4] Starting Local Hardhat Node (Chain ID 31337) on http://127.0.0.1:8545..."
cd "$DIR/contracts"
npx hardhat node > /tmp/zerotrace_hardhat.log 2>&1 &
HARDHAT_PID=$!
sleep 3

# 2. Deploy Smart Contracts & Sync Addresses
echo "▶ [2/4] Deploying CarbonCreditToken & Marketplace Contracts..."
npx hardhat run scripts/deploy.js --network localhost

# 3. Start Backend FastAPI + AI-MRV Service
echo "▶ [3/4] Starting FastAPI AI-MRV Backend on http://127.0.0.1:8000..."
cd "$DIR/backend"
PYTHONPATH=. "$DIR/backend/venv/bin/python" run.py > /tmp/zerotrace_backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# 4. Start React Vite Frontend
echo "▶ [4/4] Starting React Frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev

wait
