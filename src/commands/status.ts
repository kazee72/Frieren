import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { listContainers } from "../docker/watcher.js";

const STATE_ICONS: Record<string, string> = {
  running: "🟢",
  exited: "🔴",
  created: "⚪",
  restarting: "🔄",
  paused: "⏸️",
  dead: "💀",
  removing: "🧹",
};

function iconForState(state: string): string {
  return STATE_ICONS[state] ?? "❓";
}

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("List all Docker containers and their current state");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const containers = await listContainers();

    if (containers.length === 0) {
      await interaction.editReply("No Docker containers found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🐳 Container Status")
      .setColor(0x5865f2)
      .setTimestamp();

    const lines = containers.map(
      (c) =>
        `${iconForState(c.state)} **${c.name}** — \`${c.state}\`\n   ${c.status} · \`${c.image}\``
    );

    embed.setDescription(lines.join("\n\n"));

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to list containers:", error);
    await interaction.editReply("Failed to fetch container status. Is the Docker daemon reachable?");
  }
}