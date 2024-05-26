#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/target/deploy"

ATM_KEYPAIR="$DEPLOY_DIR/advanced_token_metadata-keypair.json"
ATM_BINARY="$DEPLOY_DIR/advanced_token_metadata.so"

# Deploy advanced token metadata program
solana program deploy --program-id $ATM_KEYPAIR $ATM_BINARY