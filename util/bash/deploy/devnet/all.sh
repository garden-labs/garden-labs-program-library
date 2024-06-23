#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/target/deploy"

HOLDER_METADATA_PLUGIN_KEYPAIR="$DEPLOY_DIR/holder_metadata_plugin-keypair.json"
AI_ALIENS_KEYPAIR="$DEPLOY_DIR/ai_aliens-keypair.json"

# Deploy advanced token metadata
$ROOT_DIR/util/bash/deploy/advanced-token-metadata.sh

# Deploy anchor programs
anchor deploy --program-name holder_metadata_plugin --program-keypair $HOLDER_METADATA_PLUGIN_KEYPAIR --provider.cluster devnet
anchor deploy --program-name ai_aliens --program-keypair $AI_ALIENS_KEYPAIR --provider.cluster devnet
