<!--
SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government

SPDX-License-Identifier: CC0-1.0
-->

# REST API-profil -  Lint Processor (RAP-LP)

[![Tag](https://img.shields.io/github/v/tag/diggsweden/rest-api-profil-lint-processor?style=for-the-badge&sort=semver&filter=%21*-*&color=green)](https://github.com/diggsweden/rest-api-profil-lint-processor/tags)

[![License: EUPL 1.2](https://img.shields.io/badge/License-European%20Union%20Public%20Licence%201.2-library?style=for-the-badge&&color=lightblue)](LICENSE)
[![REUSE](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.reuse.software%2Fstatus%2Fgithub.com%2Fdiggsweden%2Frest-api-profil-lint-processor&query=status&style=for-the-badge&label=REUSE&color=lightblue)](https://api.reuse.software/info/github.com/diggsweden/rest-api-profil-lint-processor)

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/diggsweden/rest-api-profil-lint-processor/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/diggsweden/rest-api-profil-lint-processor)

[![License: EUPL 1.2](https://img.shields.io/badge/publiccode.yml-library?style=for-the-badge&&color=orange)](publiccode.yml) 



## Beskrivning

RAP-LP är ett verktyg för att linta OpenAPI v3-definitioner med hjälp av [Spectral](https://github.com/stoplightio/spectral).<br>
Det är specifikt utvecklat för att validera OpenAPI-definitioner enligt den svenska REST API-profilens specifikation [REST API-profil](https://dev.dataportal.se/rest-api-profil).

RAP-LP kan användas lokalt i CLI-läge eller API-läge, samt via webbgränssnittet [RAP-LP](https://raplp.digg.se).

## Innehållsförteckning

<details>
<summary><strong>Översikt</strong></summary>

  - [Vad är RAP-LP](#vad-är-rap-lp)

  - [Funktionalitet](#funktionalitet)

</details>

<details>
<summary><strong>Kom igång</strong></summary>

  - [Installationsguide](#installationsguide)

    - [Installera via npm](#installera-via-npm)

      - [Installera globalt med NPM](#installera-globalt-med-npm)

      - [Installera lokalt som npm run script](#installera-lokalt-som-npm-run-script)

    - [Installera via NPX](#installera-via-npx)

    - [Installera via Podman](#installera-via-podman)

    - [Installera via Docker](#installera-via-docker)

    - [Alternativ - kör från containern med podman/docker](#alternativ---kör-från-containern-med-podmandocker)

    - [Bygg från källkod](#bygg-från-källkod)

  - [Körlägen](#körlägen)

    - [CLI-läge](#cli-läge)

      - [Flaggor för CLI-läge](#flaggor-för-cli-läge)

      - [Snabbstart](#snabbstart)

    - [API-läge](#api-läge)

      - [Endpoints för API-läge](#endpoints-för-api-läge)

      - [Snabbstart](#snabbstart-1)

    - [Strikt läge (OAS3 Validering)](#strikt-läge-oas3-validering)

    - [Validering mot en, flera eller alla regelkategorier](#validering-mot-en-flera-eller-alla-regelkategorier)

</details>

<details>
<summary><strong>Rapportering och diagnostik</strong></summary>

  - [Validering som skriver felmeddelanden till en valfri loggfil](#validering-som-skriver-felmeddelanden-till-en-valfri-loggfil)

  - [Validering som sparar loggdiagnostik i en fil](#validering-som-sparar-loggdiagnostik-i-en-fil)

  - [Validering som sparar information om regelutfall i en Excel-fil](#validering-som-sparar-information-om-regelutfall-i-en-excel-fil)

</details>

<details>
<summary><strong>Mer information</strong></summary>

  - [Riktlinjer och förklaringar](#riktlinjer-och-förklaringar)

  - [Begränsningar](#begränsningar)

  - [Exempel på regelutfall](#exempel-på-regelutfall)

    - [Förklaring av översikt för regelutfall](#förklaring-av-översikt-för-regelutfall)

    - [Förklaring av detaljering för regelutfall](#förklaring-av-detaljering-för-regelutfall)

  - [FAQ](#faq)

    - [Hur skapar jag ett GitHub Personal Access Token (PAT)?](#hur-skapar-jag-ett-github-personal-access-token-pat)

    - [Skrivåtkomst till mount från container](#skrivåtkomst-till-mount-från-container)

  - [Support](#support)
  - [Bidra](#bidra)
  - [Utveckling](#utveckling)
  - [Licens](#licens)
  - [Underhållare](#underhållare)
  - [Krediter och referenser](#krediter-och-referenser)

</details>


---

## Översikt

### Vad är RAP-LP

### Funktionalitet



## Kom igång

### Installationsguide
Följande instruktioner förutsätter att det finns en `openapi.yaml` att validera i den aktuella katalogen. <br>

Beroende på hur man önskar att nyttja verktyget måste det finnas installerade versioner av `Node.js`,`npm`, `Podman` eller `Docker`.

---

#### Installera via npm

> Notera: Att GitHub Packages (npm) kräver authentisering.<br>
> Konfigurera `.npmrc` mot rätt registry och scope, antingen globalt eller lokalt för enskilda projekt - `@diggsweden:registry=https://npm.pkg.github.com`<br>
> Om du saknar inloggning med GitHub Personal access token (PAT), se [FAQ](#hur-skapar-jag-ett-github-personal-access-token-pat).
>
> Notera: Att `<version>` byts ut mot önskad version av verktyget, oftast senaste release tag. För mer information se [versioner](#versioner).

---

##### Installera globalt med NPM

```bash
npm i -g @diggsweden/rest-api-profil-lint-processor@<version>
raplp -f openapi.yaml
```

> Notera: Att en omstart av terminal kan behövas för att `raplp` ska kunna användas som kommando.

---

##### Installera lokalt som `npm run` script

Installera och lägg som `devDependencies`:

```text
npm i --save-dev @diggsweden/rest-api-profil-lint-processor@<version>
```

Lägg till ett [`npm run` script](https://docs.npmjs.com/commands/npm-run) i din `package.json` med rätt sökväg till filen du vill validera:

```json
{
  "scripts": {
    "lint-processor": "raplp -f openapi.yaml"
  }
}
```

Nu kan du använda `npm run lint-processor`.

---

#### Installera via NPX

Kör utan installation och package.json:

```bash
npx @diggsweden/rest-api-profil-lint-processor@<version> -f openapi.yaml
```

> Notera: Att npx laddar ned paketet till en tillfällig cache-mapp om det inte redan finns en version i node_modules/.bin

---

#### Installera via Podman

Kör med podman:

```bash
podman run --rm -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml
```
---

#### Installera via Docker

Kör med docker:

```bash
docker run --rm -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml
```

> Notera: Sökvägar kan hanteras olika beroende på miljö:
>
> - Podman (Linux/macOS/WSL): -v $(pwd):/app/example
> - Docker (PowerShell): -v "${PWD}:/app/example"
> - Docker (CMD): -v %cd%:/app/example

---

#### Alternativ - kör från containern med podman/docker


1. Starta en podman/docker container:

   ```bash
   podman run --rm -it --entrypoint /bin/sh -v $(pwd):/app/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version>
   ```

2. Kör din validering ifrån containern:

   ```bash
   npm start -- -f /data/openapi.yaml
   ```

> Notera: Att det kan uppstå problem vid körningar med podman och docker i kombination med [flaggor](#tillgängliga-flaggor) som sparar information till filer. Användarens skrivrättigheter kan göra att filer inte dyker upp som önskat. Filerna kan finnas i containern men dyker inte i den mountade katalogen som specificerats. Se [FAQ](#skrivåtkomst-till-mount-från-container) för mer information.

---

#### Bygg från källkod

1. Klona ned projektet, gärna från senaste release tag.
2. Installera alla beroenden:

```bash
npm install
npm start -- -f openapi.yaml
```

> Notera: Att alla kommandon lokalt körs med `npm start --`.

---

### Körlägen

Verktyget går att köra lokalt i två olika lägen

**CLI** och **API**

**Snabbstart - lägesövergripande kommandon**

|   Kommando   | Beskrivning | Typ | Standard | Obligatorisk |
| ------------ | ----------- | --- | -------- | ------------ |
| `--help`     | ----------- | --- | -------- | ------------ |
| `--version`  | ----------- | --- | -------- | ------------ |
| `-m, --mode` | ----------- | --- | -------- | ------------ |

---

#### CLI-läge

##### Flaggor för CLI-läge

| Flagga | Beskrivning | Typ | Standard | Obligatorisk |
| ------ | ----------- | --- | -------- | ------------ |
| `-f, --file` | ----------- | --- | -------- | ------------ |
| `-c, --categories` | ----------- | --- | -------- | ------------ |
| ------ | ----------- | --- | -------- | ------------ |
| ------ | ----------- | --- | -------- | ------------ |




##### Snabbstart
> 

---

#### API-läge

Verktyget kan även köras som en lokal HTTP-server, via API (Applikation Programming Interface). I detta läge kan funktionaliteten anropas via HTTP i stället för CLI-flaggor.

##### Flaggor för API-läge
| Flagga | Beskrivning | Typ | Standard |
| ------ | ----------- | --- | -------- |
| `--enableUrlValidation` | Aktiverar URL-validering i API-läge. | boolean | `false` | Nej |
| `--urlValidationConfigFile` | Konfigurationsfil för URL-validering (fallback: `./urlValidationConfig.cjs`). | string | `./urlValidationConfig.cjs` | Nej |


##### Endpoints för API-läge

| Endpoint                               | Beskrivning |
| -------------------------------------- | ----------- |
| `/api/v1/validation/rules`             | Används för att hämta lista med tillgängliga regelkategorier som stöds av verktyget. |
| `/api/v1/validation/validatespec`      | Används för att validera en OpenAPI-specifikation mot REST API-profilens regler. |
| `/api/v1/validation/url`               | Används för att validera en OpenAPI-specifikation från en angiven URL. |
| `/api/v1/validation/generate-report`   | Används för att generera en rapport baserad på ett valideringsresultat. |
| `/api/v1/api-info`                     | Används för att hämta information om API:et. |

##### Server

##### Snabbstart
>

---

#### Strikt läge (OAS3 Validering)

Strikt-läge aktiverar validering av OpenAPI-specifikationens struktur och semantik enligt OpenAPI 3 (OAS3).

När `--strict` används verifieras OpenAPI-specifikationen först enligt OAS3.  
Kontrollen säkerställer att specifikationen är korrekt uppbyggd och semantiskt giltig innan validering mot REST API-profilens regler utförs.

Flaggan `--strict` fungerar både med CLI och API-läge.
I API-mode är strikt läge default, men kan stängas av.

Aktivera strikt-läge med:

```bash
raplp -f openapi.yaml --strict
```

Exempel på resultat när --strict används i kombination med CLI-läge:

```bash
Strict validation reported issues:
- Structural at components : should NOT have additional properties (line 6)
- Semantic at components.tags : Property "tags" is not expected to be here. (line 7)
```

---

#### Validering mot en, flera eller alla regelkategorier

Oavsett vilket läge du kör går det att filtrera vilka regelkategorier du vill validera emot.

I dagsläget är följande regelkategorier från REST API-profilen tillgängliga

| Regelkod | Regelkategori |
| -------- | ------------- |
| DokRules | Dokumentation |
| DotRules | Datum- och tidsformat |
| ResRules | Resurser |
| UfnRules | URL Format och namngivning |
| MogRules | Mognad |
| SakRules | Säkerhet |
| AmeRules | API Message |
| ArqRules | API Request |
| FelRules | Felhantering | 
| VerRules | Versionshantering |
| FnsRules | Filtrering, paginering och sökparametrar |
| ForRules | Förutsättningar |



## Rapportering och diagnostik

### Validering som skriver felmeddelanden till en valfri loggfil

För att skriva felmeddelanden till en valfri loggfil, lägg till `-l <FILE>`

```bash
raplp -f openapi.yaml -l raplp.log
```

> Notera: Att varje körning skriver över den tidigare loggfilen.

För att lägga till loggning i samma fil, lägg till `-a`

```bash
raplp -f openapi.yaml -l raplp.log -a
```

### Validering som sparar loggdiagnostik i en fil

För att spara loggdiagnostik i en fil, lägg till `-d <FILE>`

```bash
raplp -f openapi.yaml -d logDiagnostic.log
```

### Validering som sparar information om regelutfall i en Excel-fil

För att spara information om regelutfall från diagnostiseringen till en avstämningsfil i Excel, lägg till `--dex`.<br>
Om en specifik sökväg till avstämningsfilen ska anges, kan denna läggas till.<br>
Om ingen sökväg anges, genererar verktyget automatiskt en ny avstämningsfil i den katalog där det körs.

[Avstämningsfilen](document/Avstaemning_REST_API_profil_v_1_2_0_0.xlsx) i Excel har ett fast format, om en egen version av filen ska användas måste den utpekade resursen hämtas med en kompatibel version av REST API-profilen.

**Exempel utan sökväg till avstämningsfil i Excel**

```bash
raplp -f openapi.yaml --dex
```

**Exempel med sökväg till avstämningsfil i Excel**

```bash
raplp -f openapi.yaml --dex <PATH>
```

### Visa information version

För att visa aktuell version av verktyget, lägg till `--version`

```bash
raplp --version
```

### Visa hjälp

```bash
raplp --help
```
---


## Mer information

### Riktlinjer och förklaringar

Vill du veta mer om de specifika reglerna som verktyget tillämpar, se avsnittet [GUIDELINES](GUIDELINES.md) för detaljer.

### Begränsningar

Det går endast att köra RAP-LP mot en enda OpenAPI-specifikation åt gången.

---

### Exempel på regelutfall

#### Förklaring av översikt för regelutfall

Om man väljer att köra verktyget i console läge, så kommer diagnostiseringsinformationen på stdout.<br>
I denna så kommer en sammanställning av det totala regelutfallet att visas.

- Verkställda och godkända regler:
  - OK = Krav bedömt och hanterat för att möta kravet
- Verkställda och ej godkända regler
  - EJ OK = Krav bedömt, men API:et möter inte kravet
- Ej tillämpade regler
  - N/A = Krav bedömt men inte applicerbart på API:et

**Exempel:**

![alt text](document/instructions/images/regelutfall.png)

I exemplet ovan framgår det att kraven för reglerna AME.05 och VER.05 är godkända och att det aktuella API:et uppfyller dessa.<br>
Däremot är kravet för regeln DOK.03 inte godkänt, vilket innebär att API:et inte möter detta krav.<br>
Dessutom framgår det att reglerna SAK.10 och DOK.01 inte är tillämpade för det aktuella API:et.

#### Förklaring av detaljering för regelutfall

Tillsammans med diagnostiseringsinformationen följer en detaljerad beskrivning av informationen för regelutfallet. I denna beskrivning framgår följande:

- Allvarlighetsgrad: Anger allvaret av problemet som upptäckts av regeln. De möjliga värdena är error och warning, vilka tolkas enligt följande:
  - Error: Ett uppenbart fel som måste åtgärdas. I REST API-profilen motsvarar detta kravtypen SKALL och SKALL INTE.
  - Warning: Ett möjligt fel som kan behöva åtgärdas. Vissa avvikelser från specifika regler kan dock tolereras. I REST API-profilen motsvarar detta kravtypen BÖR och BÖR INTE.
- Område: Det aktuella området i REST API-profilen som regeln gäller för.
- Sökväg: Sökvägen till felet, det vill säga den JSONPath som pekar på det fält som diagnostiken avser och som orsakade felet.
- Omfattning: Det omfång som denna diagnostik gäller.

**Exempel:**

![alt text](document/instructions/images/regelutfall-2.png)

I exemplet ovan framgår det att kravet för regeln DOK.01 inte är godkänt och att det aktuella API:et inte uppfyller detta.<br>
Kravet har bedömts ha allvarlighetsgraden Error eftersom API:et bryter mot ett SKALL/SKALL INTE-krav i REST API-profilen.<br>
Det finns också information om var i den aktuella OpenAPI-specifikationen problemet återfinns.

Vidare framgår det att kravet för regeln DOK.03 inte är godkänt och att det aktuella API:et inte möter detta krav.<br>
Kravet har bedömts ha allvarlighetsgraden Warning eftersom API:et bryter mot ett BÖR/BÖR INTE-krav i REST API-profilen.<br>
Även här finns information om var i den aktuella OpenAPI-specifikationen problemet återfinns.

---

### FAQ

#### Hur skapar jag ett GitHub Personal Access Token (PAT)?

#### Skrivåtkomst till mount från container

Vid körningar med podman och docker i kombination med flaggor som sparar information till filer kan det uppstå problem kring skrivrättigheter som gör att filer inte dyker upp som önskat. Filerna kan finnas i containern men dyker inte i den mountade katalogen som specificerats.

Se till att containern har rättigheter att skriva till den katalog som du mountar.

1. Kolla rättigheter

   ```bash
   ls -ld /path/to/mount
   ```

2. Prova köra som `root user`

   ```bash
   podman run -it -v $(pwd):/data --user root ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
   ```

3. För att testa om det är ett åtkomstproblem kan du temporärt prova om det går efter du gett alla skrivrättigheter till den mountade katalogen:

   ```bash
   sudo chmod 777 /path/to/mount
   ```

4. Beroende på din miljö och vilka möjligheter du har, hantera åtkomstproblemet mer beständigt och återställ tidigare läs- och skrivrättigheter.
5. Du kan även prova:

   ```bash
   sudo podman run -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
   ```

---

### Support 

Om du har frågor, funderingar, buggrapporter etc, vänligen kontakta [Digg - Agency for Digital Government](https://www.digg.se/)

### Bidra 

Om du vill bidra till projektet, vänligen följ instruktionerna i avsnittet [Contributing](CONTRIBUTING.md).<br>
För utvecklare finns det mer information i avsnittet [Development](development/DEVELOPMENT.md).

### Utveckling

Vänligen kontakta [Digg - Agency for Digital Government](https://www.digg.se/)

### Licens

European Union Public Licence v. 1.2
Se [LICENS](LICENSE) för mer detaljer.

Copyright: [Contributor Covenant](https://www.contributor-covenant.org/)

Licens: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

### Underhållare

[Digg - Agency for Digital Government](https://github.com/diggsweden)

### Krediter och referenser

Speciellt tack till [Arbetsförmedlingen – The Swedish Public Employment Service](https://arbetsformedlingen.se/)









