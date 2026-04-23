import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { sendReminderNow } from "../scheduler/daily-reminder.js";

export const data = new SlashCommandBuilder()
  .setName("test-reminder")
  .setDescription("Sends the daily reminder to the channel immediately (for testing)");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await sendReminderNow(interaction.client);
    await interaction.reply({
      content: "Daily reminder sent!",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Failed to send test reminder:", error);
    await interaction.reply({
      content: "Failed to send reminder. Check logs for details.",
      ephemeral: true,
    });
  }
}
