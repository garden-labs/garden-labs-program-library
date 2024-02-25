#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/target/deploy"

EXAMPLE_KEYPAIR="$DEPLOY_DIR/spl_token_metadata_example-keypair.json"
EXAMPLE_BINARY="$DEPLOY_DIR/spl_token_metadata_example.so"

# Deploy example program
solana program deploy --program-id $EXAMPLE_KEYPAIR $EXAMPLE_BINARY