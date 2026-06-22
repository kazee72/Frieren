# Frieren

A Discord bot for Docker and host monitoring. It watches Docker container events in real time, posts alerts to a configured Discord channel, and exposes slash commands for inspecting container and host health.

## Features

- **Docker event watcher** — listens for container `start`, `die`, and `health_status` events and posts a Discord embed alert to a configured channel on each occurrence.
- **Alert history** — every alert is logged to a local SQLite database (`alert` table) with timestamp, container name, and event type, so past incidents can be queried later.
- **`/status`** — lists all Docker containers with their current state, status string, and image, using status icons (🟢 running, 🔴 exited, etc.).
- **`/uptime`** — shows host CPU load, memory usage, disk usage, and uptime, with visual load bars.
- **`/ping`** — basic latency check.
- **`/start`, `/stop`, `/restart`** — start, stop, or restart a container by name (owner-restricted). The container option autocompletes against existing containers.

## Setup

### Prerequisites

- Node.js 20
- A reachable Docker daemon (the bot connects via the default socket; mount `/var/run/docker.sock` if running in a container)
- A Discord application with a bot token

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
   | `DISCORD_CLIENT_ID` | Application/bot client ID |
   | `DISCORD_GUILD_ID` | Guild (server) ID where commands are registered |
   | `DISCORD_ALERT_CHANNEL_ID` | Channel where Docker event alerts are posted |
   | `OWNER_DISCORD_ID` | Discord user ID permitted to run `/start`, `/stop`, `/restart` |

3. Register slash commands (run once, or after changing command definitions):

   ```bash
   pnpm register
   ```

4. Build and start:

   ```bash
   pnpm build
   pnpm start
   ```

   For development with live reload:

   ```bash
   pnpm dev
   ```

## Commands

| Command | Description |
|---|---|
| `/ping` | Replies with bot latency. |
| `/status` | Lists all Docker containers and their current state with status icons. |
| `/uptime` | Shows host CPU load, memory, disk usage, and uptime. |
| `/start` | Starts a container (owner-restricted, autocompletes container names). |
| `/stop` | Stops a container (owner-restricted, autocompletes container names). |
| `/restart` | Restarts a container (owner-restricted, autocompletes container names). |

## Project structure

```
src/
├── commands/        # Slash command definitions
│   ├── index.ts     # Command registry
│   ├── ping.ts
│   ├── status.ts
│   └── uptime.ts
├── db/              # SQLite layer
│   ├── client.ts    # better-sqlite3 connection
│   ├── schema.ts    # Migrations (alert table)
│   └── alerts.ts    # Alert insert/query helpers
├── discord/         # Discord infrastructure
│   ├── handler.ts   # Interaction routing (chat + autocomplete)
│   └── register.ts  # Standalone command registration script
│   └── owner-gate.ts # Owner-only command gating helper
├── docker/          # Docker integration
│   └── watcher.ts   # Event stream + embed alerts + container listing
└── index.ts         # Bot entrypoint
```