import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
} from "discord.js";
import { listContainers, stopContainer } from "../docker/watcher.js";
import { rejectNonOwner } from "../discord/owner-gate.js";

export const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop a Docker container")
  .addStringOption((option) =>
    option
      .setName("container")
      .setDescription("The container to stop")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();

  try {
    const containers = await listContainers();
    const choices = containers
      .map((c) => ({ name: c.name, value: c.name }))
      .filter((c) => c.name.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(choices);
  } catch (error) {
    console.error("Autocomplete failed:", error);
    await interaction.respond([]);
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (await rejectNonOwner(interaction)) {
    return;
  }

  const name = interaction.options.getString("container", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    await stopContainer(name);
    const embed = new EmbedBuilder()
      .setTitle("🔴 Container Stopped")
      .setColor(0xed4245)
      .addFields({ name: "Container", value: `\`${name}\``, inline: true })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(`Failed to stop container ${name}:`, error);
    await interaction.editReply(`Failed to stop container \`${name}\`. It may not exist or already be stopped.`);
  }
}