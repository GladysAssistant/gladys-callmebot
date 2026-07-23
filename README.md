# Gladys CallMeBot integration

External integration for [Gladys Assistant](https://gladysassistant.com) that
sends Gladys notifications to **WhatsApp** or **Signal** through the free
[CallMeBot](https://www.callmebot.com) API.

Built with the JavaScript SDK
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js),
from the official
[integration template](https://github.com/GladysAssistant/integration-template-js).
It is the external port of the historical `callmebot` service embedded in the
Gladys core.

## How it works

This is a **send-only communication channel** (manifest
`type: "communication"`, `messaging: { receive: false }`):

- each Gladys user enters their own credentials — messaging service, phone
  number, CallMeBot API key — in the **My account** block of the Configuration
  screen, described by the manifest `contact_schema`;
- when Gladys needs to notify a user, it resolves that user's credentials and
  hands them to the integration's `onSendMessage(contact, message)` handler;
- the handler performs a single HTTP GET against the CallMeBot API
  (`whatsapp.php` or `signal/send.php`) and confirms the delivery from the
  `Message queued` response.

There is no device, no polling and no incoming path — the whole integration is
the delivery handler. User documentation (activation guides, troubleshooting)
lives in [`docs/en.md`](./docs/en.md) / [`docs/fr.md`](./docs/fr.md), re-hosted
by Gladys and linked from the Configuration screen.

## Project structure

```
.
├─ index.js                          # SDK bootstrap + onSendMessage wiring
├─ src/
│  └─ callmebot.js                   # CallMeBot "driver": URL building + delivery
├─ docs/
│  ├─ en.md                          # user documentation (linked from the
│  └─ fr.md                          #   Configuration screen)
├─ gladys-assistant-integration.json # manifest (communication, contact_schema)
├─ Dockerfile                        # Node 24 Alpine, read-only rootfs ready
├─ .github/workflows/release.yml     # UI-driven release: bump + tag + build
├─ .github/workflows/build.yml       # multi-arch build (git tag or called by release)
└─ cover.png                         # catalog cover, 800×534 px, ≤150 KB
```

## Run it locally

```bash
npm install
GLADYS_HOST_API_URL="http://localhost:1443" \
GLADYS_INTEGRATION_TOKEN="<token>" \
GLADYS_INTEGRATION_SELECTOR="callmebot" \
LOG_LEVEL=debug \
npm start
```

The three `GLADYS_*` variables are injected by the Gladys supervisor when the
integration runs inside its sandboxed container. The SDK reads them
automatically.

## Quality checks

The same three checks run automatically on every push and pull request (see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

```bash
npm run format:check   # Prettier: is everything formatted?
npm run lint           # ESLint: catch real mistakes
npm test               # Unit tests, via the built-in `node --test` runner
```

## Validate before publishing

```bash
npx github:GladysAssistant/integration-store .
```

Runs the exact same checks as the store indexer (manifest, Docker image, cover
image, code rules) and reports every problem at once.

## Release

Open **Actions → Release → Run workflow** and pick `patch`, `minor` or
`major`. The workflow bumps the version everywhere (`package.json` + manifest
`version`/`docker_image`), pushes the `vX.Y.Z` tag and builds the
`linux/amd64` + `linux/arm64` image to `ghcr.io` (`:X.Y.Z` and `:latest`).

## License

Apache-2.0
