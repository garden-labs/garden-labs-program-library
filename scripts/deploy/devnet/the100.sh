#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
source $ROOT_DIR/.env

DEPLOY_DIR="$ROOT_DIR/target/deploy"

THE100_KEYPAIR="$DEPLOY_DIR/the_100-keypair.json"
anchor deploy --program-name the_100 --program-keypair $THE100_KEYPAIR --provider.cluster devnet