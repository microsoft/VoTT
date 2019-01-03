# Overview of CI setup

## Issues found and solutions

### Environment variables in scripts sections is not cross-platform friendly

1. Option 1
   * install `cross-env` npm package
   * use `cross-env` in npm script
   * https://github.com/facebook/create-react-app/issues/1137#issuecomment-279180815

1. Option 2
   * add `--coverage` flag so test will run only once without needing to set `CI=true`
   * no need for extra package, cross platform support
   * https://github.com/facebook/create-react-app/issues/1137#issuecomment-279191193

### Logs are cut off on Windows agent when using shell

1. make sure to use Bash task and not shell