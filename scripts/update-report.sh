#!/bin/bash
set -eou pipefail

# NOTE: this script should be ran from the root of the repository; the CWD should reflect this
BASEDIR=$(dirname "$0")
REPORT_DIR=$(pwd)/report
VERSION=$(node -pe "require('./package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "cwd=$(pwd)"
echo "basedir=${BASEDIR}"
echo "reportdir=${REPORT_DIR}"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"

# This script appends code complexity reports over time. Given the amount of files, report files
# are now stored on Azure Blob Storage. It's the source of truth - we download the current report,
# run complexity analysis again, then push everything back to blob.
rm -rf ${REPORT_DIR}
mkdir -p ${REPORT_DIR}

#NOTE: be sure to set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables
az storage blob download-batch --no-progress -d report -s '$web' > /tmp/download.log

${BASEDIR}/generate-report.sh -o ${REPORT_DIR} -v ${VERSION} -c ${COMMIT_SHA}
