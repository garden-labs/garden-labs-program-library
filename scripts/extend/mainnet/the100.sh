#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
source $ROOT_DIR/.env

# Config
BYTES=30000

solana config set --url $MAINNET_RPC

DEPLOY_DIR="$ROOT_DIR/target/deploy"

THE100_KEYPAIR="$DEPLOY_DIR/the_100-keypair.json"
solana program extend $THE100_KEYPAIR $BYTES