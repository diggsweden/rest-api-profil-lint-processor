<!--
SPDX-FileCopyrightText: 2023 Digg - Agency for Digital Government

SPDX-License-Identifier: CC0-1.0
-->

# REST API-profil - Lint Processor (RAP-LP)

[![GitHub release](https://img.shields.io/github/v/release/diggsweden/rest-api-profil-lint-processor?style=for-the-badge)](#)
[![GitHub release date](https://img.shields.io/github/release-date/diggsweden/rest-api-profil-lint-processor?style=for-the-badge)](#)
[![GitHub last commit](https://img.shields.io/github/last-commit/diggsweden/rest-api-profil-lint-processor?style=for-the-badge)](#)
![GitHub license](https://img.shields.io/github/license/diggsweden/rest-api-profil-lint-processor?style=for-the-badge)

**Beskrivning**:

RAP-LP är ett kommandoradsverktyg för att linta OpenAPI v3-definitioner med hjälp av [Spectral](https://github.com/stoplightio/spectral). Verktyget är specifikt utvecklat för att linta OpenAPI-definitioner enligt den svenska REST API-profilens specifikation [REST API-profil](https://dev.dataportal.se/rest-api-profil).

## Innehållsförteckning

- [REST API-profil - Lint Processor (RAP-LP)](#rest-api-profil---lint-processor-rap-lp)
  - [Innehållsförteckning](#innehållsförteckning)
  - [Installation och krav](#installation-och-krav)
  - [Instruktioner för att komma igång snabbtt](#instruktioner-för-att-komma-igång-snabbt)
  - [Användning](#användning)
    - [Förklaring av status](#förklaring-av-status)
  - [Kända problem](#known-issues)
  - [Support](#support)
  - [Bidra](#bidra)
  - [Utveckling](#utveckling)
  - [Licens](#licens)
  - [Underhållare](#underhållare)
  - [Krediter och referenser](#krediter-och-referenser)

## Installation och krav

Det enklaste sättet att installera spectral är genom att använda [npm](https://www.npmjs.com/):

1. Klona ned projektet
2. Installera alla beroenden:

```bash
$ npm install
```

## Instruktioner för att komma igång snabbt

Använd det här kommandot för att köra applikationen mot en YAML-fil:

```bash
$ npm start -- -f Path_to_the_YAML_file
```

**Exempel**

```bash
$ npm start -- -f apis/dok-api.yaml
```

## Användning

För att validera mot en specifik kategori av regler, lägg till `-c CategoryName`.
**Exempel**

```bash
$ npm start -- -f apis/dok-api.yaml -c DokRules
```

**Tillgängliga kategorier med regler**

- UfnRules
- SakRules
- VerRules
- FnsRules
- ArqRules
- DokRules
- AmeRules
- ForRules
- DotRules

För att spara meddelanden från felloggar, lägg till `-l FileName`.
**Exempel**

```bash
$ npm start -- -f apis/dok-api.yaml -l rap-lp.log
```

För att lägga till loggning, lägg till `-a`
**Exempel**

```bash
$ npm start -- -f apis/dok-api.yaml -l rap-lp.log -a
```

För att spara loggdiagnostik i en fil, lägg till `-d FileName`
**Exempel**

```bash
$ npm start -- -f apis/dok-api.yaml -d logDiagnostic.log
```

**Visa hjälp**

```bash
$ npm start -- --help
```

**Förklaring av status:**

**\-** = Krav ej bedömt\
**OK** = Krav bedömt och hanterat för att möta kravet\
**Pågående** = Krav bedömt och hantering påbörjat men ej klart\
**NOK** = Krav bedömt men API möter inte kravet\
**N/A** = Krav bedömt men inte applicerbart på API

## Kända problem

- Det går endast att köra RAP-LP mot en enda YAML-fil åt gången.

## Support

Om du har frågor, funderingar, buggrapporter etc, vänligen kontakta [Digg - Agency for Digital Government](https://www.digg.se/)

## Bidra

Om du vill bidra till projektet, vänligen följ instruktionerna i avsnittet [Contributing](CONTRIBUTING).

## Utveckling

- Please contact [Digg - Agency for Digital Government](https://www.digg.se/)

## Licens

European Union Public Licence v. 1.2
Se [LICENS](LICENSE) för mer detaljer.

Copyright: [Contributor Covenant](https://www.contributor-covenant.org/)

Licens: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

## Underhållare

[Digg - Agency for Digital Government](https://github.com/diggsweden)

## Krediter och referenser

Speciellt tack till

- [Arbetsförmedlingen – The Swedish Public Employment Service](https://arbetsformedlingen.se/)
