#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source $ROOT_DIR/.env

DEPLOY_DIR="$ROOT_DIR/target/deploy"

echo "Advanced Token Metadata Program ID: $(solana-keygen pubkey $DEPLOY_DIR/advanced_token_metadata-keypair.json)"
echo "AI Aliens Program ID: $(solana-keygen pubkey $DEPLOY_DIR/ai_aliens-keypair.json)"
echo "Holder Metadata Plugin Program ID: $(solana-keygen pubkey $DEPLOY_DIR/holder_metadata_plugin-keypair.json)"
echo "Vending Machine Program ID: $(solana-keygen pubkey $DEPLOY_DIR/vending_machine-keypair.json)"
echo "the100 Program ID: $(solana-keygen pubkey $DEPLOY_DIR/the_100-keypair.json)"