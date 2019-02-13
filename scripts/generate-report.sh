#!/bin/bash
set -euo pipefail

# -e: immediately exit if any command has a non-zero exit status
# -o: prevents errors in a pipeline from being masked

# these are just needed for the reports; just install ad-hoc and don't save to package.json
npm install es6-plato eslint-plugin-react command-line-args --no-save

BASEDIR=$(dirname "$0")
ES6_SRC=./es6-src
REPORT_DIR=./report

# we can't do complexity analysis on TypeScript directly; transpile to ES6
rm -rf ${ES6_SRC}
tsc --noEmit false --outDir ${ES6_SRC}

node ${BASEDIR}/complexity-analysis.js --src ${ES6_SRC} --output ${REPORT_DIR}
