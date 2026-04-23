import { ButtonInteraction, TextChannel } from "discord.js";

const BUTTON_EXPIRY_MS = 60000; // 60 seconds

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const [action, channelId, userId, timestamp] = interaction.customId.split(":");

  // Check expiry
  const buttonAge = Date.now() - parseInt(timestamp);
  if (buttonAge > BUTTON_EXPIRY_MS) {
    await interaction.reply({
      content: "This confirmation has expired. Run /clear again.",
      ephemeral: true,
    });
    return;
  }

  // Check user
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "This isn't your confirmation.",
      ephemeral: true,
    });
    return;
  }

  if (action === "clear_cancel") {
    await interaction.update({
      content: "Cancelled.",
      components: [],
    });
    return;
  }

  if (action === "clear_confirm") {
    await interaction.update({
      content: "Clearing...",
      components: [],
    });

    try {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel?.isTextBased() || !(channel instanceof TextChannel)) {
        await interaction.editReply("Channel not found or not a text channel.");
        return;
      }

      let totalDeleted = 0;

      // Bulk delete messages (only works for messages < 14 days old)
      let bulkDeletedCount = 0;
      while (true) {
        const deleted = await channel.bulkDelete(100, true);
        bulkDeletedCount = deleted.size;
        totalDeleted += bulkDeletedCount;

        if (bulkDeletedCount < 100) break;
      }

      // Delete older messages individually
      while (true) {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size === 0) break;

        for (const message of messages.values()) {
          try {
            await message.delete();
            totalDeleted++;
            await new Promise((r) => setTimeout(r, 1000)); // Rate limit protection
          } catch (error) {
            console.error(`Failed to delete message ${message.id}:`, error);
          }
        }
      }

      await interaction.editReply(`Done. Deleted ${totalDeleted} messages.`);
    } catch (error) {
      console.error("Error during channel clear:", error);
      await interaction.editReply("Failed to clear channel. Check logs for details.");
    }
  }
}
