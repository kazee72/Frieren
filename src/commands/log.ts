import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { insertLog } from "../db/logs.js";

export const data = new SlashCommandBuilder()
  .setName("log")
  .setDescription("Log a learning activity")
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription("What did you learn or do?")
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(2000)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const text = interaction.options.getString("text", true);
  const userId = interaction.user.id;

  insertLog({
    userId,
    content: text,
    source: "slash",
  });

  const preview = text.length > 100 ? text.slice(0, 97) + "..." : text;
  await interaction.reply({
    content: `Logged: ${preview}`,
    ephemeral: true,
  });
}
