#!/usr/bin/env bash

# Run a code quality check

declare -A EXITCODES
declare -A SUCCESS_MESSAGES

readonly RED=$'\e[31m'
readonly NC=$'\e[0m'
readonly GREEN=$'\e[32m'
readonly YELLOW=$'\e[0;33m'
readonly HAPPY_EMOJI='\xf0\x9f\x98\x80'
readonly FAIL_EMOJI='\xf0\x9f\x98\xb1'

#Terminal chars
readonly CHECKMARK=$'\xE2\x9C\x94'
readonly MISSING=$'\xE2\x9D\x8C'

is_command_available() {
  local COMMAND="${1}"
  local INFO="${2}"

  if ! [ -x "$(command -v "${COMMAND}")" ]; then
    printf '%b Error:%b %s is not availble in path/installed.\n' "${RED}" "${NC}" "${COMMAND}" >&2
    printf 'See %s for more info about the command.\n' "${INFO}" >&2
    exit 1
  fi
}

print_header() {
  local HEADER="$1"
  printf '%b\n************ %s ***********%b\n\n' "${YELLOW}" "$HEADER" "${NC}"
}

store_exit_code() {
  declare -i STATUS="$1"
  local KEY="$2"
  local INVALID_MESSAGE="$3"
  local VALID_MESSAGE="$4"

  if [[ "${STATUS}" -ne 0 ]]; then
    EXITCODES["${KEY}"]="${INVALID_MESSAGE}"
  else
    SUCCESS_MESSAGES["${KEY}"]="${VALID_MESSAGE}"
  fi
}

lint_and_format() {
  export MEGALINTER_DEF_WORKSPACE='/repo'
  print_header 'LINTER HEALTH (MEGALINTER)'
  podman run --rm --volume "$(pwd)":/repo -e MEGALINTER_CONFIG='development/megalinter.yml' -e DEFAULT_WORKSPACE=${MEGALINTER_DEF_WORKSPACE} -e LOG_LEVEL=INFO ghcr.io/oxsecurity/megalinter-javascript:v8.8.0
  store_exit_code "$?" "Lint" "${MISSING} ${RED}Lint check failed, see logs (std out and/or ./megalinter-reports) and fix problems.${NC}\n" "${GREEN}${CHECKMARK}${CHECKMARK} Lint check passed${NC}\n"
  printf '\n\n'
}

commit() {
  local compareToBranch='main'
  local currentBranch
  currentBranch=$(git branch --show-current)
  print_header 'COMMIT HEALTH (CONFORM)'

  if [[ "$(git rev-list --count ${compareToBranch}..)" == 0 ]]; then
    printf "%s" "${GREEN} No commits found in current branch: ${YELLOW}${currentBranch}${NC}, compared to: ${YELLOW}${compareToBranch}${NC} ${NC}"
    store_exit_code "$?" "Commit" "${MISSING} ${RED}Commit check count failed, see logs (std out) and fix problems.${NC}\n" "${YELLOW}${CHECKMARK}${CHECKMARK} Commit check skipped, no new commits found in current branch: ${YELLOW}${currentBranch}${NC}\n"
  else
    podman run --rm -i --volume "$(pwd)":/repo -w /repo ghcr.io/siderolabs/conform:v0.1.0-alpha.30-2-gfadbbb4 enforce --base-branch="${compareToBranch}"
    store_exit_code "$?" "Commit" "${MISSING} ${RED}Commit check failed, see logs (std out) and fix problems.${NC}\n" "${GREEN}${CHECKMARK}${CHECKMARK} Commit check passed${NC}\n"
  fi

  printf '\n\n'
}

license() {
  print_header 'LICENSE HEALTH (REUSE)'
  podman run --rm --volume "$(pwd)":/data docker.io/fsfe/reuse:5.0.2-debian lint
  store_exit_code "$?" "License" "${MISSING} ${RED}License check failed, see logs and fix problems.${NC}\n" "${GREEN}${CHECKMARK}${CHECKMARK} License check passed${NC}\n"
  printf '\n\n'
}

check_exit_codes() {
  printf '%b********* CODE QUALITY RUN SUMMARY ******%b\n\n' "${YELLOW}" "${NC}"

  for key in "${!EXITCODES[@]}"; do
    printf '%b' "${EXITCODES[$key]}"
  done
  printf "\n"

  for key in "${!SUCCESS_MESSAGES[@]}"; do
    printf '%b' "${SUCCESS_MESSAGES[$key]}"
  done
  printf "\n"

  if [[ "${#EXITCODES[@]}" -gt 0 ]]; then
    printf '%s %b\n' "${RED}${#EXITCODES[@]} of the code quality checks failed!${NC}" "${FAIL_EMOJI}"
    exit 1
  else
    printf '%s%b\n' "${GREEN}${CHECKMARK} All code quality checks passed!${NC}" "${HAPPY_EMOJI}"
    exit 0
  fi
}

is_command_available 'podman' 'https://podman.io/'
is_command_available 'node' 'https://nodejs.org/'
is_command_available 'npm' 'https://nodejs.org/'

lint_and_format
commit
license

check_exit_codes
