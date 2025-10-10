<!--
SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor

SPDX-License-Identifier: CC0-1.0 
-->

# REST API-profil - Lint Processor (RAP-LP)
[![Tag](https://img.shields.io/github/v/tag/diggsweden/rest-api-profil-lint-processor?style=for-the-badge&sort=semver&filter=%21*-*&color=green)](https://github.com/diggsweden/rest-api-profil-lint-processor/tags)


[![License: EUPL 1.2](https://img.shields.io/badge/License-European%20Union%20Public%20Licence%201.2-library?style=for-the-badge&&color=lightblue)](LICENSE)
[![REUSE](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.reuse.software%2Fstatus%2Fgithub.com%2Fdiggsweden%2Frest-api-profil-lint-processor&query=status&style=for-the-badge&label=REUSE&color=lightblue)](https://api.reuse.software/info/github.com/diggsweden/rest-api-profil-lint-processor)

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/diggsweden/rest-api-profil-lint-processor/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/diggsweden/rest-api-profil-lint-processor)

[![License: EUPL 1.2](https://img.shields.io/badge/publiccode.yml-library?style=for-the-badge&&color=orange)](publiccode.yml)

**Beskrivning**:

RAP-LP är ett kommandoradsverktyg för att linta OpenAPI v3-definitioner med hjälp av [Spectral](https://github.com/stoplightio/spectral).<br>
Verktyget är specifikt utvecklat för att linta OpenAPI-definitioner enligt den svenska REST API-profilens specifikation [REST API-profil](https://dev.dataportal.se/rest-api-profil).

## Innehållsförteckning

- [REST API-profil - Lint Processor (RAP-LP)](#rest-api-profil---lint-processor-rap-lp)
  - [Innehållsförteckning](#innehållsförteckning)
  - [Instruktioner för att komma igång snabbt](#instruktioner-för-att-komma-igång-snabbt)
  - [Versioner](#versioner)
  - [Användning](#användning)
  - [Begränsningar](#begränsningar)
  - [Support](#support)
  - [FAQ](#faq)
  - [Bidra](#bidra)
  - [Utveckling](#utveckling)
  - [Licens](#licens)
  - [Underhållare](#underhållare)
  - [Krediter och referenser](#krediter-och-referenser)

## Instruktioner för att komma igång snabbt

Förutsätter att det finns en `openapi.yaml` att validera i den aktuella katalogen och beroende på hur man önskar att nyttja verktyget måste det finns installerade versioner av `Node.js`,`npm`, `Podman` eller `Docker`.

### NPM
> Notera: Att GitHub Packages (npm) kräver authentisering.<br>
> Projektets `.npmrc` bör vara konfigurerat mot rätt registry - `@diggsweden:registry=https://npm.pkg.github.com`<br>
> Om du saknar inloggning med GitHub Personal access token (PAT), se [FAQ](#hur-skapar-jag-ett-github-personal-access-token-pat).

> Notera: Att `<version>` byts ut mot önskad version av verktyget, oftast senaste release tag. För mer information se [versioner](#versioner).

#### Installera globalt med npm:
```bash
npm i -g @diggsweden/rest-api-profil-lint-processor@<version>
raplp -f openapi.yaml
```

#### Installera lokalt som `npm run` script

Installera och lägg som `devDependencies`:

```
npm i --save-dev @diggsweden/rest-api-profil-lint-processor@<version>
```

Lägg till ett [`npm run` script](https://docs.npmjs.com/cli/run-script) i din `package.json` med rätt sökväg till filen du vill validera:

```json
{
  "scripts": {
    "lint-processor": "raplp -f openapi.yaml"
  }
}
```

Nu kan du använda `npm run lint-processor`.

### NPX
Kör utan installation och package.json:
```bash
npx @diggsweden/rest-api-profil-lint-processor@<version> -f openapi.yaml
```

> Notera: Att npx laddar ned paketet till en tillfällig cache-mapp om det inte redan finns en version i node_modules/.bin

### Podman
Kör med podman:
```bash
podman run --rm -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml
```

### Docker
Kör med docker:
```bash
docker run --rm -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml
```
> Notera: Sökvägar kan hanteras olika beroende på miljö:
> - Podman (Linux/macOS/WSL): -v $(pwd):/app/example
> - Docker (PowerShell): -v "${PWD}:/app/example"
> - Docker (CMD): -v %cd%:/app/example

### Bygga från källkod
1. Klona ned projektet, gärna från senaste release tag.
2. Installera alla beroenden:

```bash
npm install
npm start -- -f openapi.yaml
```
> Notera: Att alla kommandon lokalt körs med `npm start --`.

## Versioner
Main-branchen, feature-brancher, pre-release- och testversioner används med reservation för att de kan innehålla funktionalitet som inte är garanterad att den är testad på samma sätt som en stabil version. 

**Stabila versioner**<br>
[Release](https://github.com/diggsweden/rest-api-profil-lint-processor/releases) ska alltid vara stabil och testad, vilket gör den till den föredragna versionen för att nyttja verktyget.<br>
Dessa versioner är taggade med `vX.X.X` utan något suffix.

**Pre-release- och testversioner**<br>
Pre-release-versioner är taggade med följande suffix:
- alpha → tidig testversion, ofta instabil
- beta → mer testad, men fortfarande pre-release
- rc → nära färdigställande, stabil release candidate

Rena testversioner är taggade med `vX.X.X-dev` följt av namnet på den branchen.<br>
Dessa versioner är byggda för att testa funktionalitet som är under utveckling.

Alla versioner av verktyget hittar du här:
- [Container Image](https://github.com/diggsweden/rest-api-profil-lint-processor/pkgs/container/rest-api-profil-lint-processor)
- [NPM Package](https://github.com/diggsweden/rest-api-profil-lint-processor/pkgs/npm/rest-api-profil-lint-processor)

## Användning
Här beskrivs vilka användningsområden verktyget har med diverse flaggor som kan sättas för att nyttja verktygets funktionalitet.

### Tillgängliga flaggor

| Flagga | Beskrivning | Typ | Standard | Obligatorisk |
|---|---|---|---|---|
| `-f, --file` | Sökväg till OpenAPI-specifikation (YAML/JSON). | string | – | Ja |
| `-c, --categories` | Regelkategorier separerade med kommatecken. Tillgängliga: `UfnRules, SakRules, VerRules, FnsRules, ArqRules, DokRules, AmeRules, ForRules, DotRules, FelRules`. | string | – | Nej |
| `-l, --logError` | Sökväg till fil för felloggning från RAP-LP. Om inte angiven skrivs loggen till stdout. | string | stdout (om ej satt) | Nej |
| `-a, --append` | Append—utökar loggen i befintlig felloggningsfil (om `--logError` används). | boolean | `false` | Nej |
| `-d, --logDiagnostic` | Sökväg till fil för diagnostiseringsinformation från RAP-LP i JSON-format. | string | – | Nej |
| `--dex` | Sökväg till fil för diagnostiseringsinformation från RAP-LP i Excel-format. | string | – | Nej |


> Notera: Att `raplp` i alla kommandon nedan ersätts med respektive miljös sätt att köra verktyget (npm, docker eller podman).

### Validering med alla regler
För att validera en openapi-definition med verktyget, lägg till `-f <YAML_FILE>`
```bash
raplp -f openapi.yaml
```

### Validering med utvalda regler
För att validera mot en specifik kategori av regler, lägg till `-c <CategoryName>`.<br>
>Notera: Att du kan lägga till flera regler som en kommaseparerad lista.

```bash
# Validera mot en specifik regel
raplp -f openapi.yaml -c DokRules

# Validera mot flera regler
raplp -f openapi.yaml -c DokRules,AmeRules,SakRules
```

#### Tillgängliga kategorier med regler

- AmeRules
- ArqRules
- DokRules
- DotRules
- FelRules
- FnsRules
- ForRules
- ResRules
- SakRules
- UfnRules
- VerRules

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

### Riktlinjer och förklaringar
Vill du veta mer om de specifika reglerna som verktyget tillämpar, se avsnittet [GUIDELINES](GUIDELINES.md) för detaljer.


### Förklaring av översikt för regelutfall

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

**Förklaring av detaljering för regelutfall:**

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

## Begränsningar

- Det går endast att köra RAP-LP mot en enda YAML-fil åt gången.

## Support

Om du har frågor, funderingar, buggrapporter etc, vänligen kontakta [Digg - Agency for Digital Government](https://www.digg.se/)

## FAQ
### Hur skapar jag ett GitHub Personal Access Token (PAT)?
1. Gå till GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Sätt Name och Expiration (ha utgångsdatum!).
3. Resource owner: välj din org/användare som äger paketen.
4. Repository access: välj relevanta repo(n).
5. Permissions:
    - För GHCR (containers): Packages → Read (lägg även Write om du ska pusha).
    - För npm.pkg.github.com (npm-paket): Packages → Read och se till att tokenet har åtkomst till det repo där paketet bor.
6. Skapa token → kopiera värdet direkt (visas bara en gång).

```bash
npm login --registry=https://npm.pkg.github.com
# username: ditt GitHub-användarnamn
# password: GitHub PAT med read:packages
```

```bash
podman login ghcr.io
# username: ditt GitHub-användarnamn
# password: GitHub PAT med read:packages
```

## Bidra

Om du vill bidra till projektet, vänligen följ instruktionerna i avsnittet [Contributing](CONTRIBUTING.md).<br>
För utvecklare finns det mer information i avsnittet [Development](development/DEVELOPMENT.md).

## Utveckling

- Vänligen kontakta [Digg - Agency for Digital Government](https://www.digg.se/)

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