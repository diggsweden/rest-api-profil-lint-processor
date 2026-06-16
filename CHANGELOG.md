# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-16

### Added

- Add swagger ui (#648)
- * feat: add concurrency handling and logging (#606)
- Add categories array to GenerateReportRequest in spec (#601)
- Add CODEOWNERS file (#605)
- Add api mode (#561)
- Add stderr for errors when writing to excel file (#485)

### Changed

- Update text for api-specification (#650)
- Update artifacts.yml
- Update with version info (#647)
- Adjust example under api request (#643)
- Change of schemaattributes
- Update spectral (#632)
- Update dev dependencies to v24.13.2 (#633)
- Update github actions to v6.0.3 (#631)
- Adjust readme to reflect recent merge changes (#598)
- Update dev dependencies to v24.13.1 (#617)
- Update x2 to make sure no external schemarefs allowed (#623)
- Update core dependencies to v4.2.0 (#616)
- Replace team with individuals in CODEOWNERS file (#613)
- Update node.js to <=24.16.0 (#603)
- Update dependency node to v24.16.0 (#602)
- Update dependency ts-jest to v29.4.11 (#595)
- Update dependency @stoplight/spectral-rulesets to v1.22.3 (#594)
- Pin dependencies (#593)
- Update spectral (#590)
- Update dependency fast-xml-parser to v5.8.0 (#589)
- Update diggsweden/reusable-ci action to v2.8.3 (#588)
- Update dev dependencies (#587)
- Update dev dependencies (#584)
- Update dependency fast-xml-parser to v5.7.3 (#583)
- Bump reusable-ci to v2.8.2
- Update actions/setup-node action to v6.4.0 (#576)
- Update dependency fast-xml-parser to v5.7.2 (#575)
- Update node.js to <=24.15.0 (#571)
- Update dependency node to v24.15.0 (#570)
- Update dependency jsonpath-plus to v10.4.0 (#551)
- Lock file maintenance (#556)
- Update spectral (#554)
- Update node.js to <=24.14.1 (#553)
- Update github actions (#552)
- Update dependency fast-xml-parser to v5.6.0 (#550)
- Update dev dependencies (#549)
- Bump reusable ci v2.7.9 (#546)
- Upgrade to reusable-ci 2.7.7 (#544)
- Upgrade to reusable-ci 2.7.7 (#543)
- Lock file maintenance (#468)
- Bump glob in the npm_and_yarn group across 1 directory (#462)
- Update actions/checkout action to v6 (#467)
- Update dependency fast-xml-parser to v5.5.7 [security] (#497)
- Update dependency @stoplight/spectral-core to v1.21.0 (#519)
- Feature/487 uppdatera meddelande excel (#529)
- Set least permissions for workflow (#533)
- Reusable-ci 2.7.3 (#532)
- Update dependency @types/node to v24.11.0 (#498)
- Update dev dependencies (#489)
- Update node.js to <=24.13.0 (#491)
- Update github actions (#490)
- Update dependency express-openapi-validator to v5.6.2 (#488)
- Pin dependency @stoplight/spectral-formats to 1.8.2 (#483)
- Pin dependencies (#465)
- Update dependency body-parser to v2.2.2 (#482)
- Update diggsweden/reusable-ci action to v2.6.0 (#481)
- Update node.js to <=24.12.0 (#479)
- Update github actions (#478)
- Update dependency fast-xml-parser to v5.3.3 (#477)
- Feature/393 schemavalidering (#470)
- Update github actions (#476)
- Update diggsweden/reusable-ci action to v2.3.8 (#472)
- Update core dependencies to v5.0.6 (#471)
- Feature/394 dok21 (#447)
- Update dependency express to v5.2.0 [security] (#469)
- Update diggsweden/reusable-ci action to v2.3.1 (#466)
- Update dependency body-parser to v2.2.1 [security] (#464)
- Update node.js to <=24.11.1 (#463)
- Update github actions (#461)
- Lock file maintenance (#459)
- Update dependency js-yaml to v4.1.1 [security] (#457)
- Feature/update node versions (#455)
- Update dependency @types/node to v24 (#444)
- Update node.js to v24 (#445)
- Lock file maintenance (#454)
- Update node.js to <=22.21.1 (#453)
- Update dependency node to v22.21.1 (#452)

### Fixed

- Adoption-of-dynamic-url-var-setting-for-versioning (#644)
- Update given path to target each server url directly and simplify regexp
- Update of schema attributes (#645)
- Adoption-of-dynamic-url-var-setting (#638)
- Allow-hateoas-hal-fix (#634)
- Update ApiInfo object with correct data before release (#622)
- Correct severitys for Dok03 (#620)
- Generate report buffer without writing to file system (#611)
- Correct references to openapi.yaml (#597)
- Update package-lock.json (#557)
- Fix broken link (#521)
- Fix project with just lint-fix, ignore some rules for now (#501)
- Upgrade to reuseable-ci 2.6.x and just (#475)

### Removed

- Remove categories from generate report request in spec (#608)

## [1.1.1] - 2025-11-06

### Fixed

- Publish npm package to gh (#448)


## [1.1.0] - 2025-11-06

### Added

- Add rule MOG.02
- Add rule MOG.01
- Add rule RES.06
- Add functionality to build and run npm package version of raplp (#409)
- Add rule DOK.11
- Add a new workflow for pre-release tags (#396)
- Add rule RES.02
- Add rule SAK.01
- Add rule DOK.09
- Add rule DOK.08
- Add rule DOK.06
- Add new rule sak16

### Changed

- Update licence headers as recommended (#441)
- Lock file maintenance (#446)
- Update dependency node to v22.21.0 (#443)
- Update readme and development about access rights to containers (#440)
- Extend rule dok.19 to also check summary in path operations
- Lock file maintenance (#435)
- Update node.js to <=22.21.0 (#434)
- Trim ci (renovate, openssf) (#431)
- Lock file maintenance (#432)
- Update node.js (#319)
- Update actions/setup-node action to v6 (#425)
- Update dependency @types/jest to v30 (#339)
- Update core dependencies (major) (#309)
- Migrate config renovate.json (#418)
- Update github actions to v5 (#313)
- Use reuseable-ci v2, dev npm support (#424)
- Update automerge for patches to only run on sat (#423)
- Improve documentation for readme and development (#417)
- Lock file maintenance (#420)
- Update dependency @types/node to ^22.18.8 (#419)
- Change primary language from english to swedish (#411)
- Update package.json (#416)
- Use reusable ci v1 (#415)
- Lock file maintenance (#414)
- Update dependency typescript to ^5.9.2 (#413)
- Update renovate scheduling
- Update dependency @types/node to ^22.18.6 (#410)
- Lock file maintenance (#406)
- Lock file maintenance (#404)
- Update dev dependencies (#401)
- Lock file maintenance (#398)
- Update dependency chalk to v5.6.2 (#397)
- Lock file maintenance (#389)
- Update github actions (#340)
- Update docker/setup-buildx-action action to v3.11.1 (#386)
- CI-adjustments (#381)
- Lock file maintenance (#382)
- Lock file maintenance (#377)
- Lock file maintenance (#376)
- Lock file maintenance (#375)
- Lock file maintenance (#374)
- Update dependency jest to ^30.0.4 (#373)
- Lock file maintenance (#372)
- Update dependency @types/node to ^22.16.3 (#371)
- Lock file maintenance (#369)
- Update dependency @types/node to ^22.16.0 (#368)
- Lock file maintenance (#367)
- Update dependency jest to ^30.0.3 (#366)
- Update dependency @types/node to ^22.15.34 (#365)
- Lock file maintenance (#364)
- Update dependency jest to ^30.0.2 (#363)
- Update dependency @types/node to ^22.15.32 (#362)
- Feature/356 sak15 (#360)
- Lock file maintenance (#359)
- Update dependency @types/node to ^22.15.31 (#348)
- Update dependency jest to v30 (#331)
- Update details for contributing. (#334)
- Lock file maintenance (#336)
- Update dependency express-openapi-validator to v5.5.7 (#335)
- Update dependency @types/node to ^22.15.30 (#330)
- Lock file maintenance (#328)
- Update dependency @types/node to ^22.15.29 (#327)
- Lock file maintenance (#324)
- Update dependency @types/node to ^22.15.21 (#323)
- Lock file maintenance (#320)
- Update dependency @types/node to ^22.15.18 (#318)
- Update node.js to v22.15.1 (#316)
- Update dependency @types/express to ^5.0.1 (#314)
- Update dependency ts-jest to ^29.3.2 (#312)
- Update dependency @types/node to ^22.15.17 (#311)
- Update node.js to <=22.15.1 (#310)

### Fixed

- Update projectType input (#427)
- Fix broken link for contributing guidelines (#338)

### Removed

- Remove src code from container image (#430)


## [1.0.0] - 2025-05-16

### Changed

- Initial commit

[2.0.0]: https://github.com/diggsweden/rest-api-profil-lint-processor/compare/v1.1.1..v2.0.0
[1.1.1]: https://github.com/diggsweden/rest-api-profil-lint-processor/compare/v1.1.0..v1.1.1
[1.1.0]: https://github.com/diggsweden/rest-api-profil-lint-processor/compare/v1.0.0..v1.1.0

<!-- generated by git-cliff -->
