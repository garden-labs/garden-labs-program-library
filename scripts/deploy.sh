#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source $ROOT_DIR/.env

# Config
KEYPAIR_FILENAME="toolkit-keypair.json"
BINARY_FILENAME="toolkit.so"
RPC=$MAINNET_RPC

DEPLOY_DIR="$ROOT_DIR/target/deploy"
KEYPAIR="$DEPLOY_DIR/$KEYPAIR_FILENAME"
BINARY="$DEPLOY_DIR/$BINARY_FILENAME"

solana config set --url $RPC

solana program deploy \
    --with-compute-unit-price 200000 \
    --max-sign-attempts 10000 \
    --program-id "$KEYPAIR" \
    "$BINARY"