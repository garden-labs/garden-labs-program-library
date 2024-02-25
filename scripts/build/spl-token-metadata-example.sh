#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXAMPLE_DIR="$ROOT_DIR/programs-vanilla/spl-token-metadata-example"

cd $EXAMPLE_DIR
cargo build-bpf
cd ..