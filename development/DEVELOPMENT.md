# Utvecklingsguide

Denna guide beskriver de viktigaste grunderna för utveckling i detta projekt.

## Innehållsförteckning
- [Installation](#installation-och-konfiguration)
- [Förutsättningar](#förutsättningar)
- [Utvecklingsflöde](#utvecklingsflöde)
  -[Pull Request-flöde](#pull-request-flöde)
- [Releaseprocess](#releaseprocess)
  - [Utveckling](#release-för-utveckling)
  - [Produktion](#release-för-produktion)
- [Testa och verifiera](#testa-och-verifiera)
- [Eventuella hinder](#eventuella-hinder)

## Installation
1. Klona ned projektet, gärna från senaste release tag.
2. Installera alla beroenden och provkör:

```bash
npm install
npm start -- --help
npm start -- -f openapi.yaml
```

## Förutsättningar
Du bör ha följande installerat för att arbeta i projektet:
- Nodejs
- Podman och/eller Docker
- Git

## Utvecklingsflöde

### Utveckla
 - Skapa en ämnesgren från projektets huvudgren, oftast baserat på och namngett efter ett ärende i backlogen.
    - feature/ny-feature
    - fix/ny-fix
 - Pusha dina ändringar till ämnesgrenen.
 - Öppna en ny pull request till huvudprojektet när du känner dig klar.

 Följ allmänna regler kring [CONTRIBUTING.md](../CONTRIBUTING.md)

### Pull Request-flöde

När du skickar in en PR kommer CI automatiskt att köra flera kontroller.<br/>
För att undvika överraskningar bör du köra dessa kontroller lokalt först.

#### Köra kvalitetskontroller lokalt

1. Kör kvalitetskontrollscriptet:
   ```shell
   ./development/code_quality.sh
   ```
2. Åtgärda eventuella problem
3. Uppdatera din PR med fixarna
4. Verifiera att CI passerar i den uppdaterade PR:en

#### Detaljer för kvalitetskontroller

- **Lintning med megalinter**: BASH, Markdown, YAML, Typescript, GitHub Actions, säkerhetsskanning
- **Licensöverensstämmelse**: REUSE-verktyget säkerställer korrekt copyright-information
- **Commit-struktur**: Conform kontrollerar commit-meddelanden för changelog-generering
- **Beroendeanalys**: Skannar efter sårbarheter, utdaterade paket och licensproblem
- **OpenSSF Scorecard**: Validerar säkerhetsbästa praxis

#### Hantering av misslyckade kontroller

Om några kontroller misslyckas i CI-pipelinen:

1. Granska CI-fel-loggarna
2. Kör kontrollerna lokalt för att återskapa problemen
3. Gör nödvändiga fixar i din lokala miljö
4. Uppdatera din Pull Request
5. Verifiera att alla kontroller passerar i den uppdaterade PR:en

## Releaseprocess
Det finns två olika workflows för att göra en ny release, antingen för en feature under utveckling eller för produktion.

- [Utveckling](../.github/workflows/release-dev-workflow.yml)
- [Produktion](../.github/workflows/release-workflow.yml)

För varje ny release kommer det bland annat att det byggas en docker image och ett npm paket som kan hämtas hem och köras. <br>
Projektets releaser bygger på en gemensam struktur för DiggSweden vilken innefattar säkerhetsrutiner, automatiserade releaser och kvalitetskontroller. <br>
För mer information se [Reusable CI/CD Workflows](https://github.com/diggsweden/reusable-ci?tab=readme-ov-file#reusable-cicd-workflows).

### Release för utveckling
Genom att pusha till en branch med prefix **dev/** eller **feat/** skapas en utvecklingsrelease vilket möjliggör tester av paket och images innan produktion.

> **Utvecklingsreleaser kommer ***INTE*** generera och uppdatera changelog, release notes eller göra en ny release i GitHub.**

### Release för produktion
Vid release till produktion kan man välja om man vill släppa det som en pre-release version eller som en stabil version.

> **Produktionsreleaser kommer automatiskt generera och uppdatera changelog, release notes och göra en ny release i GitHub.**

#### Pre-release
Annotera pre-release-taggen med suffix och en version, använd suffix:
- alpha → tidig testversion, ofta instabil
- beta → mer testad, men fortfarande pre-release
- rc → nära färdigställande, stabil release candidate

X kan ersättas med vilken siffersekvens som helst bestående av 0–9.

***Säkerställ att tagg-versionen matchar versionen i package.json och package-lock.json.***

```
git checkout <branch>
git pull
git tag -s -a vX.X.X-SUFFIX.x -m "vX.X.X-SUFFIX.X"
git push origin vX.X.X-SUFFIX.X
```

Exempel:

```
git tag -s -a v1.0.3-alpha.1 -m "v1.0.3-alpha.1"
git push origin v1.0.3-alpha.1
```

#### Stabil release
Checka ut main, hämta senaste ändringarna och tagga senaste commit på main.

***Säkerställ att tagg-versionen matchar versionen i package.json och package-lock.json.***

```
git checkout <branch>
git pull
git tag -s -a vX.X.X -m "vX.X.X"
git push origin vX.X.X
```

Exempel:
```
git tag -s -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

***På grund av projektbegränsningar är pre- och stabila releaser från main endast möjliga för admins!***

## Testa och verifiera
Efter varje release, pre- eller stabil, bör funktionaliteten testas och verifieras.

### Testa mot publicerat npm paket
Kör följande kommando mot den version av verktyget som ska testas: 
```bash
npx @diggsweden/rest-api-profil-lint-processor@latest -f openapi.yaml -l raplp.log --dex avstamning.xlsx
``` 

---

#### Test av image med podman/docker
Kör följande kommandon med den version av verktyget som ska testas:
```bash
podman run -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
```

> För alla kommandon bör ***podman*** kunna ersättas med ***docker*** om så önskas.

I en terminal kör:
  ```bash
  podman run --rm -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest -f /data/openapi.yaml
  ```
* Där data motsvarar den katalog i containern som du vill att nuvarande katalog \$(pwd) mountas in i, containern får tillgång till dina filer i \$(pwd).
* Där `openapi.yaml` motsvarar den filen som du vill applicera valideringen på.
* Där \<VERSION> motsvarar den version av rest-api-profilen som du vill nyttja.

> Notera: Sökvägar kan hanteras olika beroende på miljö:
> - Podman (Linux/macOS/WSL): -v $(pwd):/app/example
> - Docker (PowerShell): -v "${PWD}:/app/example"
> - Docker (CMD): -v %cd%:/app/example

Exempel
  ```bash
  podman run --rm -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
  ```

Vid eventuella fel och du inte hittar rap-lp-error.log kan du behöva köra kommandot via containern enligt den alternativa instruktionen nedan.<br>
Se till att containern har rättigheter att skriva till den katalog som du mountar, se [Skrivåtkomst till mount från container](#skrivåtkomst-till-mount-från-container).

#### Alternativ att köra ifrån containern
1. Starta en podman container:
    ```bash
    podman run --rm -it --entrypoint /bin/sh -v $(pwd):/app/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest
    ```
2. Kör din validering ifrån containern:
    ```bash
    npm start -- -f /data/openapi.yaml
    ```
3. Lägg på önskade flaggor enligt tidigare exempel.

Exempel:
```bash
podman run --rm -it --entrypoint /bin/sh -v $(pwd):/app/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest

/app: npm start -- -f data/openapi.yaml -l data/raplp.log --dex data/avstamning.xlsx # skriver till din nuvarande katalog
```

## Eventuella hinder

#### Access till registry

Du kan behöva ett Personal Access Token (PAT) för din användare i github för att kunna hämta images från Github Container Registry (GHCR) och Github Packages, se [FAQ i readme](../README.md/#hur-skapar-jag-ett-github-personal-access-token-pat).

#### Skrivåtkomst till mount från container
1. Kolla rättigheter
    ```bash
    ls -ld /path/to/mount
    ```
2. För att testa om det är ett åtkomstproblem kan du temporärt prova om det går efter du gett alla skrivrättigheter till den mountade katalogen:
    ```bash
    sudo chmod 777 /path/to/mount
    ```
3. Beroende på din miljö och vilka möjligheter du har, hantera åtkomstproblemet mer beständigt och återställ tidigare läs- och skrivrättigheter.
4. Du kan även prova:  
    ```bash
    sudo podman run -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:latest -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
    ```

