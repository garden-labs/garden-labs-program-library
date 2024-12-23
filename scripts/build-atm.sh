#!/bin/bash
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source $ROOT_DIR/.env

ATM_DIR="$ROOT_DIR/advanced-token-metadata/program"

cd $ATM_DIR
cargo build-bpf
cd ..