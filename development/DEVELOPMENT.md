# Utvecklingsguide

Denna guide beskriver de viktigaste grunderna för utveckling i detta projekt.

## Innehållsförteckning
- [Installation och konfiguration](#installation-och-konfiguration)
  - [IDE-inställningar](#ide-inställningar)
- [Utvecklingsflöde](#utvecklingsflöde)
  - [Testning och verifiering](#testning-och-verifiering)
- [Releaseprocess](#releaseprocess)
  - [CI-release](#ci-release)
  - [Lokal release](#lokal-release)
  - [Felsökning](#felsökning)

## Installation och konfiguration

### IDE-inställningar

#### VSCode



## Utvecklingsflöde

### Pull Request-flöde

När du skickar in en PR kommer CI automatiskt att köra flera kontroller.<br/>
För att undvika överraskningar bör du köra dessa kontroller lokalt först.

#### Förutsättningar
- [Podman](https://podman.io/)

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

### Testa och verifiera release
Efter varje release, pre- eller stabil, bör funktionaliteten testas och verifieras.

#### Test av image
Kör följande kommandon med den version av verktyget du vill testa – [använd podman/docker](../README.md#användning-via-podmandocker)
```bash
# EXEMPEL: podman run -it -v $(pwd):/app/example ghcr.io/diggsweden/rest-api-profil-lint-processor:1.0.0 -f example/dot-api.yaml -l example/rap-lp.log --dex example/avstamning.xlsx
podman run --rm -it -v $(pwd):/<PATH> ghcr.io/diggsweden/rest-api-profil-lint-processor:<VERSION X.X.X> -f <PATH>/<YAML_FILE>
```
#### Test av npm-paket
Kör följande kommandon med den version av verktyget du vill testa – [använd node](../README.md#användning)
```bash
# EXEMPEL: npx @diggsweden/rest-api-profil-lint-processor@1.0.0 -f openapi-test.yaml -l rap-lp.log -d avstamning.xlsx
npx @diggsweden/rest-api-profil-lint-processor@1.0.0 -f <PATH>/<YAML_FILE>
```

