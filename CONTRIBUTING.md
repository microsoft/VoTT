We welcome [issues](https://github.com/Microsoft/VoTT/issues) and [pull requests](https://github.com/Microsoft/VoTT/pulls) into the project. We ask that you follow these simple guidelines:

### Issues

- Look for duplicate issues & comment on thread if experiencing something similar
- Fill in template information (platform, OS, version, screenshots, etc.)

### Pull Requests

1. Find an issue to work on, or create a new one
2. Fork repo, make sure you have latest changes from `v2`
3. Create branch following naming convention: `git checkout -b issue-<###>-<short-description>`.
4. Write code
5. Add unit tests
6. Verify linting and unit tests by running `npm test`
7. Update docs if needed
8. Rebase on `v2` and resolve conflicts
9. Submit PR to `v2` branch

Try to keep PRs small to decrease the time required to review and merge.

### Style

1. This repo uses [EditorConfig](https://editorconfig.org/) to maintain consistent styles across multiple platforms and IDEs., please refer to
   this [guide](docs/STYLE.md) for more information.
