#!/bin/bash
set -euo pipefail

# This script appends code complexity reports over time. Given the amount of files, report files
# are now stored on Azure Blob Storage. It's the source of truth - we download the current report,
# run complexity analysis again, then push everything back to blob.
rm -rf report
mkdir -p report

#NOTE: be sure to set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables
az storage blob download-batch -d report -s '$web'

npm run plato

# push appended report back to blob - CLI will correctly take care of MIME types
az storage blob upload-batch -d '$web' -s report
