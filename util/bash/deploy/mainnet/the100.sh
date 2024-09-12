#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

source "$ROOT_DIR/.env"

solana config set --url $MAINNET_RPC

DEPLOY_DIR="$ROOT_DIR/target/deploy"

THE100_KEYPAIR="$DEPLOY_DIR/the_100-keypair.json"
THE100_BINARY="$DEPLOY_DIR/the_100.so"

solana program deploy --with-compute-unit-price 200000 --max-sign-attempts 10000 --program-id $THE100_KEYPAIR $THE100_BINARY