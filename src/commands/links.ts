import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { searchLinks } from "../db/links.js";
import { db } from "../db/client.js";

export const data = new SlashCommandBuilder()
  .setName("links")
  .setDescription("Search the FMHY starred link archive")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Search query")
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(100)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString("query", true);

  // Check if link table has any data
  const count = db.prepare("SELECT COUNT(*) as count FROM link").get() as { count: number };
  if (count.count === 0) {
    await interaction.reply({
      content: "Link archive is empty — run pnpm seed-links first.",
      ephemeral: true,
    });
    return;
  }

  try {
    const results = searchLinks(query);

    if (results.length === 0) {
      await interaction.reply({
        content: `No links found for "${query}".`,
        ephemeral: true,
      });
      return;
    }

    let reply = `🔍 Results for "${query}":\n\n`;

    for (const link of results) {
      const star = link.starred ? "⭐ " : "";
      const categoryLine = link.category
        ? `\n   ${link.category}${link.subcategory ? " / " + link.subcategory : ""}`
        : "";

      reply += `${star}${link.name} — <${link.url}>${categoryLine}\n\n`;
    }

    await interaction.reply({
      content: reply.trim(),
      ephemeral: true,
    });
  } catch (error) {
    console.error("Failed to search links:", error);
    await interaction.reply({
      content: "Failed to search links. Check logs for details.",
      ephemeral: true,
    });
  }
}
