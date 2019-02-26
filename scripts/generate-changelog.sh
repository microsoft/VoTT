#!/bin/bash
set -euo pipefail

# NOTE: To generate a changlelog, a git revision range is required. This can be commit SHAs,
# but for all links in the template to work, tags are expected. The CWD should be set to the
# root of the repository.
echo "cwd=$(pwd)"

PARAMS=""
while (( "$#" )); do
  case "$1" in
    -t|--to)
      TO_COMMIT=$2
      shift 2
      ;;
    -f|--from)
      FROM_COMMIT=$2
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

BASE_GITHUB_URL=https://github.com/Microsoft/VoTT
RELEASE_DATE=$(date +"%m-%d-%Y")
TEMPLATE="# [${TO_COMMIT}](${BASE_GITHUB_URL}/compare/${FROM_COMMIT}...${TO_COMMIT}) (${RELEASE_DATE})\n[GitHub Release](${BASE_GITHUB_URL}/releases/tag/${TO_COMMIT})\n\n"
CL_START='<!-- cl-start -->'

# Grab all non-merge commits (from PRs). Current PR policy is squash and merge,
# using the fast-forward option, so merge commits *shouldn't* be present in the commit history.
COMMITS=$(git log --pretty=%s --no-merges ${FROM_COMMIT}..${TO_COMMIT})

echo "Generating changlog from ${FROM_COMMIT} to ${TO_COMMIT}..."
while read -r line;
do
  echo "${line}"
  TEMPLATE="${TEMPLATE}- ${line}\n"
done <<< "${COMMITS}"

# Attemped to use `sed` here, but between new lines and escape characters,
# quickly became untenable. Python, perl and a couple other solutions come to mind,
# but npm/JS are very xplat friendly and we're already using that tooling.
# sed -i -e "s/${CL_START}/${CL_START}\n${TEMPLATE}/" CHANGELOG.md

npm install replace-in-file --no-save
./node_modules/.bin/replace-in-file "${CL_START}" "$(echo -e ${CL_START}\\n\\n${TEMPLATE})" CHANGELOG.md
