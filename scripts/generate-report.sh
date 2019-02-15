#!/bin/bash
set -euo pipefail

# -e: immediately exit if any command has a non-zero exit status
# -o: prevents errors in a pipeline from being masked

BASEDIR=$(dirname "$0")
ES6_SRC=$(pwd)/es6-src

PARAMS=""
while (( "$#" )); do
  case "$1" in
    -o|--output)
      REPORT_DIR=$2
      shift 2
      ;;
    -v|--version)
      VERSION=$2
      shift 2
      ;;
    -c|--commit)
      COMMIT_SHA=$2
      shift 2
      ;;
    --) # end argument parsing
      shift
      break
      ;;
    -*|--*=) # unsupported flags
      echo "Error: Unsupported flag $1" >&2
      exit 1
      ;;
    *) # preserve positional arguments
      PARAMS="$PARAMS $1"
      shift
      ;;
  esac
done
# set positional arguments in their proper place
eval set -- "$PARAMS"

echo "cwd=$(pwd)"
echo "basedir=${BASEDIR}"
echo "source=${ES6_SRC}"
echo "output=${REPORT_DIR}"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"

# these are just needed for the reports; just install ad-hoc and don't save to package.json
npm install es6-plato eslint-plugin-react command-line-args --no-save

# we can't do complexity analysis on TypeScript directly; transpile to ES6
rm -rf ${ES6_SRC}
tsc --noEmit false --outDir ${ES6_SRC}

node ${BASEDIR}/complexity-analysis.js --src ${ES6_SRC} --output ${REPORT_DIR} --version ${VERSION} --commit ${COMMIT_SHA}
