import { ChatInputCommandInteraction } from "discord.js";

export function isOwner(interaction: ChatInputCommandInteraction): boolean {
  const ownerId = process.env.OWNER_DISCORD_ID;
  if (!ownerId) {
    return false;
  }
  return interaction.user.id === ownerId;
}

export async function rejectNonOwner(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  if (isOwner(interaction)) {
    return false;
  }

  await interaction.reply({
    content: "This command is restricted to the bot owner.",
    ephemeral: true,
  });
  return true;
}