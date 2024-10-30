<!--
SPDX-FileCopyrightText: 2023 Digg - Agency for Digital Government

SPDX-License-Identifier: CC0-1.0
-->

# REST API-profil - Lint Processor (RAP-LP)

**Description**:  
A work-in-progress linter for the swedish rest api-profile specification [REST API-profil](https://dev.dataportal.se/rest-api-profil).
RAP-LP is a command-line tool to lint OpenAPI v3 definitions using [Spectral](https://github.com/stoplightio/spectral).


## Table of Contents

- [REST API-profil - Lint Processor (RAP-LP)](#rest-api-profil---lint-processor-rap-lp)
  - [Table of Contents](#table-of-contents)
  - [Installation and Requirements](#installation-and-requirements)
  - [Quick start instructions](#quick-start-instructions)
    - [REST API Mode](#rest-api-mode)
    - [CLI Mode](#cli-command-line-interface-mode)
    - [Usage](#usage)
  - [Known issues](#known-issues)
  - [Support](#support)
  - [Contributing](#contributing)
  - [Development](#development)
  - [License](#license)
  - [Maintainers](#maintainers)
  - [Credits and References](#credits-and-references)


## Installation and Requirements
The easiest way to install spectral is to use [npm](https://www.npmjs.com/):
1. Clone the repository
2. Install the dependencies: 
```bash
$ npm install
```


## Quick start instructions
This application can be used in two different modes:

### REST API Mode
The application also provides a way to validate . 

**To start a local development server run:**
```bash
$ npm start -- m api
```

**Validate against the endpoint:**
```bash
POST http://localhost:3000/api/v1/validation/validate
```

**Request body - application/json**
```bash 
{
  "yaml": "<base64encoded file>",
  "categories": [
    "CATEGORY1",
    "CATEGORY2"
  ]
}
```

**Use this command to validate a YAML-file using a terminal:**
```bash
$ curl -X POST http://localhost:3000/api/v1/validation/validate \
    -H "Content-Type: application/json" \
    -d "{\"yaml\": \"$(base64 -w 0 Path_to_the_YAML_file)\", \"categories\": [\"CATEGORY1\", \"CATEGORY2\"]}"
```

**Example**
```bash
$ curl -X POST http://localhost:3000/api/v1/validation/validate \
    -H "Content-Type: application/json" \
    -d "{\"yaml\": \"$(base64 -w 0 apis/dok-api.yaml)\", \"categories\": [\"DokRules\", \"UfnRules\"]}"
```

### CLI (Command-Line Interface) Mode
   You can interact with the application directly from your terminal using various command-line options.
   Use this command to run the application on YAML-file: 
```bash
$ npm start -- -m cli -f Path_to_the_YAML_file
```

**Example** 
```bash
$ npm start -- -m cli -f apis/dok-api.yaml
```

### Usage (cli-mode only)
To validate a specific category add `-c CategoryName`
**Example**
```bash
$ npm start -- -m cli -f apis/dok-api.yaml -c DokRules
```
   **Available categories**
  * UfnRules
  * SakRules
  * VerRules
  * FnsRules
  * ArqRules
  * DokRules
  * AmeRules
  * ForRules
  * DotRules
  
To save log errors in a file add `-l FileName`
**Example**
```bash
$ npm start -- -m cli -f apis/dok-api.yaml -l rap-lp.log
```

To append logs add `-a`
**Example**
```bash
$ npm start -- -m cli -f apis/dok-api.yaml -l rap-lp.log -a
```

To save log diagnostic in a file add `-d FileName`
**Example**
```bash
$ npm start -- -m cli -f apis/dok-api.yaml -d logDiagnostic.log
```

**Show help**
```bash
$ npm start -- --help
```

## Known issues
* You can only run one RAP-LP on a single YAML-file

## Support
* If you have questions, concerns, bug reports, etc, please contact [Digg - Agency for Digital Government](https://www.digg.se/)

## Contributing
* Create a new feature branch: 
```bash
$ git checkout -b feature/feature-ver01
``` 
* Replace feature-ver01 with the name of the rule you will work on.
* Commit and push the changes you have made: 
```bash
$ git push origin feature/feature-ver01
```
* Go to GitHub and submit a pull request to the develop branch
You need to add a reviewer via GitHub. 
The reviewer will review your pull request and decide whether to accept it.
* If your pull request is accepted then you can merged into the develop branch of the project.
* RAP-LP team must review the develop branch and merge to main branch.

## Development
* Please contact [Digg - Agency for Digital Government](https://www.digg.se/)


## License
European Union Public Licence v. 1.2
See the [LICENSE]([LICENSE](https://github.com/diggsweden/rest-api-profil-lint-processor/blob/main/LICENSE)) file for details

## Maintainers
[Digg - Agency for Digital Government](https://github.com/diggsweden)

## Credits and References
Special Thanks to
* [Arbetsförmedlingen – The Swedish Public Employment Service](https://arbetsformedlingen.se/)
