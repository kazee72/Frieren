import Docker from "dockerode";
import { EmbedBuilder, Client, ChannelType, TextChannel } from "discord.js";
import { insertAlert } from "../db/alerts.js";

const WATCHED_EVENTS = new Set(["die", "start", "health_status"]);

const EVENT_COLORS: Record<string, number> = {
  start: 0x57f287,
  die: 0xed4245,
  health_status: 0xfee75c,
};

const EVENT_ICONS: Record<string, string> = {
  start: "🟢",
  die: "🔴",
  health_status: "🟡",
};

const EVENT_LABELS: Record<string, string> = {
  start: "Container started",
  die: "Container stopped",
  health_status: "Health status changed",
};

let docker: Docker | null = null;

function getDocker(): Docker {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
}

async function resolveContainerName(id: string): Promise<string> {
  try {
    const container = getDocker().getContainer(id);
    const info = await container.inspect();
    return info.Name.replace(/^\//, "") || id.slice(0, 12);
  } catch {
    return id.slice(0, 12);
  }
}

function buildEmbed(
  eventName: string,
  containerName: string,
  detail?: string
): EmbedBuilder {
  const icon = EVENT_ICONS[eventName] ?? "📡";
  const label = EVENT_LABELS[eventName] ?? `Event: ${eventName}`;
  const color = EVENT_COLORS[eventName] ?? 0x5865f2;

  const embed = new EmbedBuilder()
    .setTitle(`${icon} ${label}`)
    .setColor(color)
    .addFields({ name: "Container", value: `\`${containerName}\``, inline: true })
    .setTimestamp();

  if (detail) {
    embed.addFields({ name: "Detail", value: detail, inline: false });
  }

  return embed;
}

export async function startDockerWatcher(client: Client): Promise<void> {
  const alertChannelId = process.env.DISCORD_ALERT_CHANNEL_ID;

  if (!alertChannelId) {
    console.warn(
      "DISCORD_ALERT_CHANNEL_ID not set. Docker event watcher will be disabled."
    );
    return;
  }

  let channel: TextChannel | null = null;
  try {
    const fetched = await client.channels.fetch(alertChannelId);
    if (fetched && fetched.type === ChannelType.GuildText) {
      channel = fetched as TextChannel;
    } else {
      console.warn("DISCORD_ALERT_CHANNEL_ID is not a guild text channel.");
      return;
    }
  } catch (error) {
    console.error("Failed to fetch alert channel:", error);
    return;
  }

  const targetChannel = channel;

  try {
    const stream = await getDocker().getEvents({
      filters: {
        type: ["container"],
        event: Array.from(WATCHED_EVENTS),
      },
    });

    console.log("Docker event watcher started.");

    let buffer = "";

    stream.setEncoding("utf8");

    stream.on("data", async (chunk: string) => {
      buffer += chunk;

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!line) continue;

        let payload: {
          status: string;
          id: string;
          Type?: string;
          Actor?: { Attributes?: Record<string, string> };
        };
        try {
          payload = JSON.parse(line);
        } catch {
          continue;
        }

        const eventName = payload.status;

        if (!WATCHED_EVENTS.has(eventName)) continue;

        const containerName = await resolveContainerName(payload.id);
        const healthStatus = payload.Actor?.Attributes?.["health"];

        let detail: string | undefined;
        if (eventName === "health_status" && healthStatus) {
          detail = `Health: \`${healthStatus}\``;
        } else if (eventName === "die") {
          const exitCode = payload.Actor?.Attributes?.["exitCode"];
          if (exitCode) detail = `Exit code: \`${exitCode}\``;
        }

        insertAlert({ containerName, eventType: eventName });

        try {
          await targetChannel.send({ embeds: [buildEmbed(eventName, containerName, detail)] });
        } catch (error) {
          console.error("Failed to send Docker alert embed:", error);
        }
      }
    });

    stream.on("error", (error: Error) => {
      console.error("Docker event stream error:", error);
    });

    stream.on("end", () => {
      console.warn("Docker event stream ended.");
    });
  } catch (error) {
    console.error("Failed to start Docker event watcher:", error);
  }
}

export async function listContainers(): Promise<
  Array<{ name: string; state: string; status: string; image: string }>
> {
  const containers = await getDocker().listContainers({ all: true });
  return containers
    .map((c) => ({
      name: c.Names[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12),
      state: c.State,
      status: c.Status,
      image: c.Image,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function startContainer(name: string): Promise<void> {
  await getDocker().getContainer(name).start();
}

export async function stopContainer(name: string): Promise<void> {
  await getDocker().getContainer(name).stop();
}

export async function restartContainer(name: string): Promise<void> {
  await getDocker().getContainer(name).restart();
}