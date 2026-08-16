#!/usr/bin/env bash
set -e

echo "============================================================"
echo "🌿 RUNNING FULL ZEROTRACE VERIFICATION TEST SUITE"
echo "============================================================"

# 1. Test Smart Contracts with Hardhat
echo ""
echo "▶ [1/2] Running Hardhat Smart Contract Unit Tests..."
cd /home/daksh/zerotrace/contracts
npx hardhat test

# 2. Test Backend AI-MRV & Cryptographic Oracle with Pytest
echo ""
echo "▶ [2/2] Running Backend AI-MRV & Oracle Integration Tests..."
cd /home/daksh/zerotrace/backend
PYTHONPATH=. /home/daksh/zerotrace/backend/venv/bin/pytest -v tests

echo ""
echo "============================================================"
echo "✅ ALL ZEROTRACE TESTS PASSED SUCCESSFULLY!"
echo "============================================================"
