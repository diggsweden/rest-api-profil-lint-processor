# Utvecklingsguide

Denna guide beskriver de viktigaste grunderna för utveckling i detta projekt.

## Innehållsförteckning

- [Installation och konfiguration](#installation-och-konfiguration)
  - [Förutsättningar](#förutsättningar)
  - [Installation](#installation)
- [Utvecklingsflöde](#utvecklingsflöde)
  - [Utveckla](#utveckla)
  - [Pull Request-flöde](#pull-request-flöde)
  - [Kvalitetskontroller med just](#kvalitetskontroller-med-just)
- [Releaseprocess](#releaseprocess)
- [Testa och verifiera](#testa-och-verifiera)
- [Eventuella hinder](#eventuella-hinder)

## Installation och konfiguration

### Förutsättningar - Linux

1. Installera [mise](https://mise.jdx.dev/) (hanterar lintverktyg):

   ```bash
   curl https://mise.run | sh
   ```

2. Aktivera mise i ditt shell:

   ```bash
   # För bash - lägg till i ~/.bashrc
   eval "$(mise activate bash)"

   # För zsh - lägg till i ~/.zshrc
   eval "$(mise activate zsh)"

   # För fish - lägg till i ~/.config/fish/config.fish
   mise activate fish | source
   ```

   Starta sedan om din terminal.

3. Installera pipx (behövs för reuse licenslinting):

   ```bash
   # Debian/Ubuntu
   sudo apt install pipx
   ```

4. Installera Nodejs, Podman och/eller Docker, Git

5. Installera projektverktyg:

   ```bash
   mise install
   ```

### Förutsättningar - macOS

1. Installera [mise](https://mise.jdx.dev/) (hanterar lintverktyg):

   ```bash
   brew install mise
   ```

2. Aktivera mise i ditt shell:

   ```bash
   # För zsh - lägg till i ~/.zshrc
   eval "$(mise activate zsh)"

   # För bash - lägg till i ~/.bashrc
   eval "$(mise activate bash)"

   # För fish - lägg till i ~/.config/fish/config.fish
   mise activate fish | source
   ```

   Starta sedan om din terminal.

3. Installera nyare bash än macOS-standard:

   ```bash
   brew install bash
   ```

4. Installera pipx (behövs för reuse licenslinting):

   ```bash
   brew install pipx
   ```

5. Installera Nodejs, Podman och/eller Docker, Git

6. Installera projektverktyg:

   ```bash
   mise install
   ```

### Installation

1. Klona ned projektet, gärna från senaste release tag.
2. Installera alla beroenden och provkör:

```bash
npm install
npm start -- --help
npm start -- -f openapi.yaml
```

## Utvecklingsflöde

### Utveckla

- Skapa en ämnesgren från projektets huvudgren, oftast baserat på och namngett efter ett ärende i backlogen.
  - feature/ny-feature
  - fix/ny-fix
- Pusha dina ändringar till ämnesgrenen.
- Öppna en ny pull request till huvudprojektet när du känner dig klar.

Följ allmänna regler kring [CONTRIBUTING.md](../CONTRIBUTING.md)

### Pull Request-flöde

När du skickar in en PR kommer CI automatiskt att köra flera kontroller.
För att undvika överraskningar bör du köra dessa kontroller lokalt först.

```shell
# Installera lintverktyg (första gången)
mise install
just setup-devtools

# Visa alla körbra just-recept
just

# Kör alla kontroller
just verify

# Eller kör endast linting
just lint-all

# Autofixa där det är möjligt
just lint-fix
```

#### Detaljer för kvalitetskontroller

- **Linting**: Shell, YAML, Markdown, TypeScript, GitHub Actions
- **Säkerhet**: Hemlighetsskanning med gitleaks
- **Licensefterlevnad**: REUSE-verktyget säkerställer korrekt copyright-information
- **Commit-struktur**: Gommitlint kontrollerar commit-meddelanden för changelog-generering

#### Hantering av misslyckade kontroller

Om några kontroller misslyckas i CI-pipelinen:

1. Granska CI-fel-loggarna
2. Kör `just verify` lokalt för att återskapa problemen
3. Gör nödvändiga fixar i din lokala miljö
4. Uppdatera din Pull Request
5. Verifiera att alla kontroller passerar i den uppdaterade PR:en

### Kvalitetskontroller med just

Kör `just` för att se alla tillgängliga kommandon. Huvudkommandon:

| Kommando | Beskrivning |
|----------|-------------|
| `just verify` | Kör alla kontroller (lint + test) |
| `just lint-all` | Kör alla linters |
| `just lint-fix` | Autofixa lintproblem |
| `just test` | Kör tester |
| `just build` | Bygg projektet |
| `just clean` | Rensa byggartefakter |

#### Lintkommandon

| Kommando | Verktyg | Beskrivning |
|----------|---------|-------------|
| `just lint-commits` | gommitlint | Validera commit-meddelanden |
| `just lint-secrets` | gitleaks | Skanna efter hemligheter |
| `just lint-yaml` | yamlfmt | Linta YAML-filer |
| `just lint-markdown` | rumdl | Linta markdown-filer |
| `just lint-shell` | shellcheck | Linta shell-skript |
| `just lint-shell-fmt` | shfmt | Kontrollera shell-formatering |
| `just lint-actions` | actionlint | Linta GitHub Actions |
| `just lint-license` | reuse | Kontrollera licensefterlevnad |

#### Fixkommandon

| Kommando | Beskrivning |
|----------|-------------|
| `just lint-yaml-fix` | Fixa YAML-formatering |
| `just lint-markdown-fix` | Fixa markdown-formatering |
| `just lint-shell-fmt-fix` | Fixa shell-formatering |

## Releaseprocess

Releaseprocessen hanteras automatiskt av maintainer-teamet via intern dokumentation.

## Testa och verifiera

Efter varje release, pre- eller stabil, bör funktionaliteten testas och verifieras.

### Testa mot publicerat npm-paket

Kör följande kommando mot den version av verktyget som ska testas:

```bash
npx @diggsweden/rest-api-profil-lint-processor@<version> -f openapi.yaml -l raplp.log --dex avstamning.xlsx
```

### Test av image med podman/docker

Kör följande kommandon med den version av verktyget som ska testas:

```bash
podman run -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
```

> För alla kommandon bör **podman** kunna ersättas med **docker** om så önskas.

I en terminal kör:

```bash
podman run --rm -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml
```

- Där data motsvarar den katalog i containern som du vill att nuvarande katalog `$(pwd)` mountas in i, containern får tillgång till dina filer i `$(pwd)`.
- Där `openapi.yaml` motsvarar den filen som du vill applicera valideringen på.
- Där `<version>` motsvarar den version av rest-api-profilen som du vill nyttja.

> Notera: Sökvägar kan hanteras olika beroende på miljö:
>
> - Podman (Linux/macOS/WSL): `-v $(pwd):/app/example`
> - Docker (PowerShell): `-v "${PWD}:/app/example"`
> - Docker (CMD): `-v %cd%:/app/example`

Exempel:

```bash
podman run --rm -it -v $(pwd):/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version> -f /data/openapi.yaml -l /data/raplp.log --dex /data/avstamning.xlsx
```

Vid eventuella fel och du inte hittar rap-lp-error.log kan du behöva köra kommandot via containern enligt den alternativa instruktionen nedan.
Se till att containern har rättigheter att skriva till den katalog som du mountar, se [Skrivåtkomst till mount från container](#skrivåtkomst-till-mount-från-container).

#### Alternativ att köra ifrån containern

1. Starta en podman container:

   ```bash
   podman run --rm -it --entrypoint /bin/sh -v $(pwd):/app/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version>
   ```

2. Kör din validering ifrån containern:

   ```bash
   npm start -- -f /data/openapi.yaml
   ```

3. Lägg på önskade flaggor enligt tidigare exempel.

Exempel:

```bash
podman run --rm -it --entrypoint /bin/sh -v $(pwd):/app/data ghcr.io/diggsweden/rest-api-profil-lint-processor:<version>

/app: npm start -- -f data/openapi.yaml -l data/raplp.log --dex data/avstamning.xlsx # skriver till din nuvarande katalog
```

## Eventuella hinder

### Access till registry

Du kan behöva ett Personal Access Token (PAT) för din användare i github för att kunna hämta images från Github Container Registry (GHCR) och Github Packages, se [FAQ i readme](../README.md/#hur-skapar-jag-ett-github-personal-access-token-pat).

### Skrivåtkomst till mount från container

Vid körningar med podman och docker i kombination med flaggor som sparar information till filer kan det uppstå problem kring skrivrättigheter som gör att filer inte dyker upp som önskat.
Filerna kan finnas i containern men dyker inte i den mountade katalogen som specificerats.
Se [FAQ i readme](../README.md/#skrivåtkomst-till-mount-från-container).
