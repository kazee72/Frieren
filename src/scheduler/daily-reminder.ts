import cron from "node-cron";
import type { Client, User } from "discord.js";

const REMINDER_MESSAGE = "What'd you work on today? Reply to this DM and I'll log it.\n\n(Also: remember to git push!)";

export async function startDailyReminder(client: Client): Promise<void> {
  const reminderUserId = process.env.REMINDER_USER_ID;

  if (!reminderUserId) {
    console.log("REMINDER_USER_ID not set, skipping daily reminder setup.");
    return;
  }

  let reminderUser: User;

  try {
    reminderUser = await client.users.fetch(reminderUserId);
    console.log(`Daily reminder will be sent to ${reminderUser.tag} (${reminderUserId})`);
  } catch (error) {
    console.error(`Failed to fetch user ${reminderUserId} for daily reminder:`, error);
    return;
  }

  cron.schedule(
    "30 15 * * *",
    async () => {
      try {
        await reminderUser.send(REMINDER_MESSAGE);
        console.log(`Daily reminder sent to ${reminderUser.tag}`);
      } catch (error) {
        console.error("Failed to send daily reminder:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Europe/Zurich",
    }
  );

  console.log("Daily reminder scheduled for 15:30 Europe/Zurich");
}

export async function sendReminderNow(client: Client): Promise<void> {
  const reminderUserId = process.env.REMINDER_USER_ID;

  if (!reminderUserId) {
    throw new Error("REMINDER_USER_ID not set");
  }

  const reminderUser = await client.users.fetch(reminderUserId);
  await reminderUser.send(REMINDER_MESSAGE);
}
