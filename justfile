# SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
#
# SPDX-License-Identifier: CC0-1.0

# Quality checks and automation for REST API Profil Lint Processor
# Run 'just' to see available commands

devtools_repo := env("DEVBASE_CHECK_REPO", "https://github.com/diggsweden/devbase-check")
devtools_dir := env("XDG_DATA_HOME", env("HOME") + "/.local/share") + "/devbase-check"
lint := devtools_dir + "/linters"
node_lint := devtools_dir + "/linters/node"
colors := devtools_dir + "/utils/colors.sh"

# Color variables
CYAN_BOLD := "\\033[1;36m"
GREEN := "\\033[1;32m"
BLUE := "\\033[1;34m"
NC := "\\033[0m"

# ==================================================================================== #
# DEFAULT - Show available recipes
# ==================================================================================== #

# Display available recipes
default:
    @printf "{{CYAN_BOLD}} REST API Profil Lint Processor{{NC}}\n\n"
    @printf "Quick start: {{GREEN}}just setup-devtools{{NC}} | {{BLUE}}just verify{{NC}}\n\n"
    @just --list --unsorted

# ==================================================================================== #
# SETUP - Development environment setup
# ==================================================================================== #

# ▪ Install devtools and tools
[group('setup')]
install: setup-devtools tools-install deps-install

# ▪ Setup devtools (clone or update)
[group('setup')]
setup-devtools:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -d "{{devtools_dir}}" ]]; then
        # setup.sh handles update checks with 1-hour cache
        if [[ -f "{{devtools_dir}}/scripts/setup.sh" ]]; then
            "{{devtools_dir}}/scripts/setup.sh" "{{devtools_repo}}" "{{devtools_dir}}"
        fi
    else
        printf "Cloning devbase-check to %s...\n" "{{devtools_dir}}"
        mkdir -p "$(dirname "{{devtools_dir}}")"
        git clone --depth 1 "{{devtools_repo}}" "{{devtools_dir}}"
        git -C "{{devtools_dir}}" fetch --tags --depth 1 --quiet
        latest=$(git -C "{{devtools_dir}}" describe --tags --abbrev=0 origin/main 2>/dev/null || echo "")
        if [[ -n "$latest" ]]; then
            git -C "{{devtools_dir}}" fetch --depth 1 origin tag "$latest" --quiet
            git -C "{{devtools_dir}}" checkout "$latest" --quiet
        fi
        printf "Installed devbase-check %s\n" "${latest:-main}"
    fi

# Check required tools are installed
[group('setup')]
check-tools: _ensure-devtools
    @{{devtools_dir}}/scripts/check-tools.sh --check-devtools mise git just node npm rumdl yamlfmt actionlint gitleaks shellcheck shfmt conform reuse hadolint

# Install tools via mise
[group('setup')]
tools-install: _ensure-devtools
    @mise install

# Install npm dependencies
[group('setup')]
deps-install:
    npm install

# ==================================================================================== #
# VERIFY - Quality assurance
# ==================================================================================== #

# ▪ Run all checks (linters + tests)
[group('verify')]
verify: _ensure-devtools check-tools
    @{{devtools_dir}}/scripts/verify.sh
    @just test

# ==================================================================================== #
# LINT - Code quality checks
# ==================================================================================== #

# ▪ Run all linters with summary
[group('lint')]
lint-all: _ensure-devtools
    @{{devtools_dir}}/scripts/verify.sh

# Validate commit messages
[group('lint')]
lint-commits:
    @{{lint}}/commits.sh

# Scan for secrets
[group('lint')]
lint-secrets:
    @{{lint}}/secrets.sh

# Lint YAML files
[group('lint')]
lint-yaml:
    @{{lint}}/yaml.sh check

# Lint markdown files
[group('lint')]
lint-markdown:
    @{{lint}}/markdown.sh check

# Lint shell scripts
[group('lint')]
lint-shell:
    @{{lint}}/shell.sh

# Check shell formatting
[group('lint')]
lint-shell-fmt:
    @{{lint}}/shell-fmt.sh check

# Lint GitHub Actions
[group('lint')]
lint-actions:
    @{{lint}}/github-actions.sh

# Check license compliance
[group('lint')]
lint-license:
    @{{lint}}/license.sh

# Lint XML files (no-op for this project)
[group('lint')]
lint-xml:
    @{{lint}}/xml.sh

# Lint containers (no-op for this project)
[group('lint')]
lint-container:
    @{{lint}}/container.sh

# Lint Node code (all: eslint, prettier, types)
[group('lint')]
lint-node:
    @{{node_lint}}/lint.sh

# Lint Node - eslint only
[group('lint')]
lint-node-eslint:
    @{{node_lint}}/eslint.sh

# Lint Node - prettier check only
[group('lint')]
lint-node-format:
    @{{node_lint}}/format.sh check

# Lint Node - type checking only
[group('lint')]
lint-node-ts-types:
    @{{node_lint}}/types.sh

# ==================================================================================== #
# LINT-FIX - Auto-fix code issues
# ==================================================================================== #

# ▪ Fix all auto-fixable issues
[group('lint-fix')]
lint-fix: _ensure-devtools lint-yaml-fix lint-markdown-fix lint-shell-fmt-fix lint-node-format-fix
    #!/usr/bin/env bash
    source "{{colors}}"
    just_success "All auto-fixes completed"

# Fix YAML formatting
[group('lint-fix')]
lint-yaml-fix:
    @{{lint}}/yaml.sh fix

# Fix markdown formatting
[group('lint-fix')]
lint-markdown-fix:
    @{{lint}}/markdown.sh fix

# Fix shell formatting
[group('lint-fix')]
lint-shell-fmt-fix:
    @{{lint}}/shell-fmt.sh fix

# Fix Node formatting
[group('lint-fix')]
lint-node-format-fix:
    @{{node_lint}}/format.sh fix

# ==================================================================================== #
# TEST - Run tests
# ==================================================================================== #

# ▪ Run tests
[group('test')]
test:
    #!/usr/bin/env bash
    source "{{colors}}"
    just_header "Running tests" "npm test"
    npm test
    just_success "Tests passed"

# ==================================================================================== #
# BUILD - Build project
# ==================================================================================== #

# ▪ Build project
[group('build')]
build:
    #!/usr/bin/env bash
    source "{{colors}}"
    just_header "Building" "npm run build"
    npm run build
    just_success "Build completed"

# Clean build artifacts
[group('build')]
clean:
    #!/usr/bin/env bash
    source "{{colors}}"
    just_header "Cleaning" "rm -rf dist node_modules"
    rm -rf dist node_modules
    just_success "Clean completed"

# ==================================================================================== #
# INTERNAL
# ==================================================================================== #

[private]
_ensure-devtools:
    @just setup-devtools
