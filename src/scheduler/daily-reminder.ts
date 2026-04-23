import cron from "node-cron";
import type { Client, TextChannel, Message } from "discord.js";

let lastReminderMessage: Message | null = null;

export async function startDailyReminder(client: Client): Promise<void> {
  const reminderUserId = process.env.REMINDER_USER_ID;
  const reminderChannelId = process.env.REMINDER_CHANNEL_ID;

  if (!reminderUserId) {
    console.log("REMINDER_USER_ID not set, skipping daily reminder setup.");
    return;
  }

  if (!reminderChannelId) {
    console.log("REMINDER_CHANNEL_ID not set, skipping daily reminder setup.");
    return;
  }

  // Send reminder at 15:30
  cron.schedule(
    "30 15 * * *",
    async () => {
      try {
        const channel = await client.channels.fetch(reminderChannelId);
        if (channel?.isTextBased()) {
          const message = await (channel as TextChannel).send(`<@${reminderUserId}> What'd you work on today?`);
          lastReminderMessage = message;
          console.log(`Daily reminder sent to channel ${reminderChannelId}`);
        } else {
          console.error("Reminder channel is not text-based");
        }
      } catch (error) {
        console.error("Failed to send daily reminder:", error);
      }
    },
    {
      timezone: "Europe/Zurich",
    }
  );

  // Delete reminder at 09:00 the next morning
  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        if (lastReminderMessage) {
          await lastReminderMessage.delete();
          console.log("Daily reminder message deleted");
          lastReminderMessage = null;
        }
      } catch (error) {
        console.error("Failed to delete daily reminder:", error);
      }
    },
    {
      timezone: "Europe/Zurich",
    }
  );

  console.log("Daily reminder scheduled for 15:30 Europe/Zurich");
  console.log("Daily reminder cleanup scheduled for 09:00 Europe/Zurich");
}

export async function sendReminderNow(client: Client): Promise<void> {
  const reminderUserId = process.env.REMINDER_USER_ID;
  const reminderChannelId = process.env.REMINDER_CHANNEL_ID;

  if (!reminderUserId) {
    throw new Error("REMINDER_USER_ID not set");
  }

  if (!reminderChannelId) {
    throw new Error("REMINDER_CHANNEL_ID not set");
  }

  const channel = await client.channels.fetch(reminderChannelId);
  if (channel?.isTextBased()) {
    const message = await (channel as TextChannel).send(`<@${reminderUserId}> What'd you work on today?`);
    lastReminderMessage = message;
  } else {
    throw new Error("Reminder channel is not text-based");
  }
}
