# Development Guide

This guide outlines core essentials for developing in this project.

## Table of Contents
- [Setup and Configuration](#setup-and-configuration)
  - [IDE Setup](#ide-setup)
- [Development Workflow](#development-workflow)
  - [Testing and Verification](#testing-format-and-lint)
- [Release Process](#the-release-workflow)
  - [CI Release](#ci-release-process)
  - [Local Release](#local-release-process)
  - [Troubleshooting](#troubleshooting)

## Setup and Configuration

### IDE Setup

#### VSCode



## Development Workflow

### Pull Request Workflow

When submitting a PR, CI will automatically run several checks. To avoid surprises, run these checks locally first.

#### Prerequisites
- [Podman](https://podman.io/)

#### Running Code Quality Checks Locally

1. Run the quality check script:
   ```shell
   ./development/code_quality.sh
   ```
2. Fix any identified issues
3. Update your PR with fixes
4. Verify CI passes in the updated PR

#### Quality Check Details

- **Linting with megalinter**: BASH, Markdown, YAML, Typescript, GitHub Actions, security scanning
- **License Compliance**: REUSE tool ensures proper copyright information
- **Commit Structure**: Conform checks commit messages for changelog generation
- **Dependency Analysis**: Scans for vulnerabilities, outdated packages, and license issues
- **OpenSSF Scorecard**: Validates security best practices

#### Handling Failed Checks

If any checks fail in the CI pipeline:

1. Review the CI error logs
2. Run checks locally to reproduce the issues
3. Make necessary fixes in your local environment
4. Update your Pull Request
5. Verify all checks pass in the updated PR

## The Release Workflow
There is a workflow for publishing images and packages either as a pre-release version or as a stable version.

### Pre-release
Annotate the pre-release tag with suffix and a version, use suffixes:
- alpha → early test version, often unstable.
- beta → more tested, but still pre-release.
- rc → close to completion, stable release candidate.

X can be replaced with any sequence of digits consisting of the numbers 0-9.
```
git tag vX.X.X-SUFFIX.X
git push origin vX.X.X-SUFFIX.X
```

Example:

```
git tag v1.6.0-rc.1
git push origin v1.6.0-rc.1
```

### Stable release

Checkout main, pull the latest changes and tag the latest main commit.

```
git tag v.X.X.X
git push origin vX.X.X
```

Example:
```
git tag v.1.0.0
git push origin v1.0.0
```

