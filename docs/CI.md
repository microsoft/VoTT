# Overview of CI setup

## Issues found and solutions

1. Environment variables in scripts sections is not cross-platform friendly
   * install `cross-env` npm packge
   * use `cross-env` in npm script
   * https://github.com/facebook/create-react-app/issues/1137#issuecomment-279180815

1. Logs are cut off on Windows agent when using shell
   * make sure to use Bash task and not shell