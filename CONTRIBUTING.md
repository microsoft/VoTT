# Contributing to VoTT

We welcome [issues](https://github.com/Microsoft/VoTT/issues) and [pull requests](https://github.com/Microsoft/VoTT/pulls) into the project. We ask that you follow these simple guidelines:

<!-- generated using: https://www.npmjs.com/package/markdown-toc-->
<!-- command: `markdown-toc -i CONTRIBUTING.md --bullets "*"`-->

<!-- toc -->

* [Issues](#issues)
* [Pull Requests](#pull-requests)
* [Commit Message Guidelines](#commit-message-guidelines)
  * [Commit Message Format](#commit-message-format)
  * [Header](#header)
    * [Type](#type)
    * [Short Description](#short-description)
  * [Body](#body)
  * [Footer](#footer)
  * [Commit Message Example](#commit-message-example)
* [Style](#style)

<!-- tocstop -->

## Issues

* Look for duplicate issues & comment on thread if experiencing something similar
* Fill in template information (platform, OS, version, screenshots, etc.)

## Pull Requests

1. Find an issue to work on, or create a new one.
1. Fork the repo and/or pull down the latest changes from `master`.
1. Create branch following naming convention: `git checkout -b issue-<###>-<short-description>`.
1. Write code.
1. Add unit tests.
1. Verify linting and unit tests by running `npm test`.
1. Update docs if needed.
1. Rebase on `master` and resolve conflicts.
1. Commit your changes using a descriptive commit message that follows [our commit message conventions](#commit-message-guidelines). Adherence to these conventions is necessary for the [change log](CHANGELOG.md) to be automatically generated from these messages.
1. Submit PR to `master` branch.

Please try to keep PRs small to decrease the time required to review and merge.

## Commit Message Guidelines

We have adopted standards similar to [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit) for how our git commit messages should be formatted. This leads to more readable messages, which are easier to follow when looking through the project history. Those messages are used to generate the [VoTT change log](CHANGELOG.md).

### Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**.

```text
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

The footer should contain any information about **breaking changes** and is also the place to
reference Azure DevOps user stories/tasks or GitHub issues that this commit **closes**.

### Commit Message Example

```text
fix: add debouncing to asset scroller to correct browser scroll position

There is no debouncing when we store the asset container's scroll position.
This results in erratic, jumpy scrolling and a poor user experience. Improve
stability and usability with debouncing.

AB#17056
```

## Style

* This repo uses [EditorConfig](https://editorconfig.org/) to maintain consistent styles across multiple platforms and IDEs. Please refer to
   this [guide](docs/STYLE.md) for more information.

Thank you!
