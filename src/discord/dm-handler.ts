import type { Message } from "discord.js";
import { insertLog } from "../db/logs.js";

export async function handleDMMessage(message: Message): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!message.channel.isDMBased()) {
    return;
  }

  const reminderUserId = process.env.REMINDER_USER_ID;
  if (!reminderUserId || message.author.id !== reminderUserId) {
    return;
  }

  try {
    insertLog({
      userId: message.author.id,
      content: message.content,
      source: "dm",
    });

    await message.react("✅");
  } catch (error) {
    console.error("Failed to log DM message:", error);
    await message.react("❌").catch(() => {});
  }
}
