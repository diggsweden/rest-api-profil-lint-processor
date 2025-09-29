# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated changelog generation using git-cliff
- Standardized release process with unified workflows
- SBOM generation for all releases
- GPG signing for release artifacts
- Container image publishing with SLSA provenance
- MegaLinter integration for code quality checks

### Changed
- Migrated to centralized release workflows from diggsweden/.github
- Updated workflow to use release-orchestrator for coordinated releases
- Enhanced pre-release workflow with proper npm tagging

### Fixed
- Re-enabled MegaLinter in pull request workflow

## [1.0.3-alpha.1] - 2025-01-01

### Added
- Initial alpha release
- OpenAPI v3 linting with Spectral
- Command-line interface for validation
- Express API server mode
- XML report generation
- ZIP file processing support

### Changed
- Updated dependencies to latest versions

### Fixed
- Various linting issues

## [1.0.2] - 2024-12-15

### Added
- Basic OpenAPI validation functionality
- Docker container support

## [1.0.1] - 2024-12-01

### Fixed
- Initial bug fixes

## [1.0.0] - 2024-11-15

### Added
- Initial release
- Core linting functionality
- Basic CLI interface
