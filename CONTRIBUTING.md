# Contributing to VoTT
We welcome [issues](https://github.com/Microsoft/VoTT/issues) and [pull requests](https://github.com/Microsoft/VoTT/pulls) into the project. We ask that you follow these simple guidelines:

<!-- toc -->

- [Issues](#issues)
- [Pull Requests](#pull-requests)
- [Commit Message Guidelines](#commit-message-guidelines)
  - [Commit Message Format](#commit-message-format)
  - [Header](#header)
    - [Type](#type)
    - [Short Description](#short-description)
  - [Body](#body)
  - [Footer](#footer)
  - [Commit Message Example](#commit-message-example)
- [Style](#style)

<!-- tocstop -->

## Issues

- Look for duplicate issues & comment on thread if experiencing something similar
- Fill in template information (platform, OS, version, screenshots, etc.)

## Pull Requests

1. Find an issue to work on, or create a new one
2. Fork repo, make sure you have latest changes from `v2`
3. Create branch following naming convention: `git checkout -b issue-<###>-<short-description>`.
4. Write code
5. Add unit tests
6. Verify linting and unit tests by running `npm test`
7. Update docs if needed
8. Rebase on `v2` and resolve conflicts
9. Commit your changes using a descriptive commit message that follows [our commit message conventions](#commit-message-guidelines). Adherence to these conventions is necessary because the [change log](CHANGELOG.md) is automatically generated from these messages.
10. Submit PR to `v2` branch

Try to keep PRs small to decrease the time required to review and merge.

## Commit Message Guidelines
We have adopted standards similar to [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit) for how our git commit messages should be formatted. We believe that this leads to more readable messages that are easier to follow when looking through the project history and in addition, are used to generate the [VoTT change log](CHANGELOG.md).


### Commit Message Format
Each commit message consists of a **header**, a **body** and a **footer**.

```
<type>: <short description>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Header
#### Type
Must be one of the following:

* **build**: Changes that affect the build system or external dependencies
* **ci**: Changes to our CI configuration files and scripts
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

#### Short Description
Contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

### Body
Just as in the **short description**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer
The footer should contain any information about **Breaking Changes** and is also the place to
reference Azure DevOps user stories/tasks or GitHub issues that this commit **Closes**.

### Commit Message Example
```
fix: add debouncing to asset scroller to correct browser scroll position

There is no debouncing when we store the asset container's scroll position.
This results in erratic, jumpy scrolling and a poor user experience. improve
stability and usability with debouncing.

AB#17056
```

## Style

1. This repo uses [EditorConfig](https://editorconfig.org/) to maintain consistent styles across multiple platforms and IDEs., please refer to
   this [guide](docs/STYLE.md) for more information.
