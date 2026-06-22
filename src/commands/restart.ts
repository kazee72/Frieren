import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
} from "discord.js";
import { listContainers, restartContainer } from "../docker/watcher.js";
import { rejectNonOwner } from "../discord/owner-gate.js";

export const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Restart a Docker container")
  .addStringOption((option) =>
    option
      .setName("container")
      .setDescription("The container to restart")
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
    await restartContainer(name);
    const embed = new EmbedBuilder()
      .setTitle("🔄 Container Restarted")
      .setColor(0xfee75c)
      .addFields({ name: "Container", value: `\`${name}\``, inline: true })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error(`Failed to restart container ${name}:`, error);
    await interaction.editReply(`Failed to restart container \`${name}\`. It may not exist.`);
  }
}