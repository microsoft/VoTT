#!/bin/bash
set -euo pipefail

PARAMS=""
while (( "$#" )); do
  case "$1" in
    -p|--previous)
      PREVIOUS_VERSION=$2
      shift 2
      ;;
    -n|--new)
      NEW_VERSION=$2
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

BASEDIR=$(dirname "$0")
PROMPT=$(echo -e "This will create changes to open a release PR for VoTT v${NEW_VERSION}?\nNOTE: a clean working git directory is required.\nDo you want to continue? [Y/n] ")
RELEASE_BRANCH=release-${NEW_VERSION}

read -p "${PROMPT}" -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "cwd=$(pwd)"
    echo "basedir=${BASEDIR}"
    echo "version=${NEW_VERSION}"

    # get the latest from v2, create a release branch
    git checkout master
    git pull
    git checkout -b ${RELEASE_BRANCH}
    echo "Creating local tag ${NEW_VERSION}"
    git tag -a ${NEW_VERSION} -m "VoTT v${NEW_VERSION}"
    # update package.json version and the changelog
    npm install json --no-save
    # NOTE: at some point, we need to move to `npm version` and do all of this via build system
    ./node_modules/.bin/json -I -f package.json -4 -e "this.version=\"${NEW_VERSION}\""
    ./node_modules/.bin/json -I -f package-lock.json -4 -e "this.version=\"${NEW_VERSION}\""
    ${BASEDIR}/generate-changelog.sh --from ${PREVIOUS_VERSION} --to ${NEW_VERSION}
    git commit -am "ci: update package version and changelog for ${NEW_VERSION} release"
    git push -u origin ${RELEASE_BRANCH}
    # remove the local tag, used for the changelog
    echo "Deleting local tag ${NEW_VERSION}"
    git tag -d ${NEW_VERSION}
fi
