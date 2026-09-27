# Local self-hosted deployment

This mode binds JagaWarga only to `127.0.0.1`. It is suitable for local acceptance and operator testing; it is **not** a public production launch.

## Requirements

- Docker Engine with Compose v2.
- Node.js 22 for local helper and verification scripts.
- Enough local capacity for the app, Redis, and PostgreSQL containers.

## Start

```bash
npm run local:env
npm run local:up
npm run local:verify
```

Open `http://127.0.0.1:3000`. The generated `.env.local-deploy` is mode `0600`, ignored by Git, and contains random local credentials. Keep it private.

## Stop

```bash
npm run local:down
```

To remove the local PostgreSQL volume intentionally:

```bash
docker compose --env-file .env.local-deploy down --volumes
```

## Safety boundary

- The published port is loopback-only.
- Risky features remain deny-by-default.
- Redis and PostgreSQL are not published to the host.
- Containers use dropped capabilities and `no-new-privileges`.
- Local HTTP is allowed only for the local preflight.
- This workflow does not satisfy public-launch legal, usability, provider, pentest, infrastructure, or incident-drill gates.