#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"

source $ROOT_DIR/.env

DEPLOY_DIR="$ROOT_DIR/target/deploy"

# Deploy advanced token metadata
solana config set --url $SOLANA_DEVNET_RPC
ATM_KEYPAIR="$DEPLOY_DIR/advanced_token_metadata-keypair.json"
ATM_BINARY="$DEPLOY_DIR/advanced_token_metadata.so"
solana program deploy --program-id $ATM_KEYPAIR $ATM_BINARY

# Deploy anchor programs
HOLDER_METADATA_PLUGIN_KEYPAIR="$DEPLOY_DIR/holder_metadata_plugin-keypair.json"
AI_ALIENS_KEYPAIR="$DEPLOY_DIR/ai_aliens-keypair.json"
THE100_KEYPAIR="$DEPLOY_DIR/the_100-keypair.json"
anchor deploy --program-name holder_metadata_plugin --program-keypair $HOLDER_METADATA_PLUGIN_KEYPAIR --provider.cluster devnet
anchor deploy --program-name ai_aliens --program-keypair $AI_ALIENS_KEYPAIR --provider.cluster devnet
anchor deploy --program-name the_100 --program-keypair $THE100_KEYPAIR --provider.cluster devnet
