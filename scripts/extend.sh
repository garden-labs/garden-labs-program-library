#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
source $ROOT_DIR/.env

# Config
KEYPAIR_FILENAME="toolkit-keypair.json"
BYTES=30000
RPC=$MAINNET_RPC

DEPLOY_DIR="$ROOT_DIR/target/deploy"
KEYPAIR="$DEPLOY_DIR/$KEYPAIR_FILENAME"

solana config set --url $RPC

solana program extend $KEYPAIR $BYTES