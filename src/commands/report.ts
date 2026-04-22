import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AttachmentBuilder,
  ChannelType,
} from "discord.js";
import { getLogsInRange } from "../db/logs.js";

export const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Generate a learning log report")
  .addIntegerOption((option) =>
    option
      .setName("days")
      .setDescription("Number of days to include (default: 7)")
      .setMinValue(1)
      .setMaxValue(31)
      .setRequired(false)
  );

const WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function formatReport(
  logs: Array<{ created_at: string; content: string }>,
  fromDate: Date,
  toDate: Date
): string {
  if (logs.length === 0) {
    return "No entries in the selected range.";
  }

  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = toDate.toISOString().split("T")[0];

  const groupedByDate = new Map<string, Array<{ time: string; content: string }>>();

  for (const log of logs) {
    // Convert UTC timestamp to Europe/Zurich local time
    const utcDate = new Date(log.created_at + "Z");
    const localDate = new Date(
      utcDate.toLocaleString("en-US", { timeZone: "Europe/Zurich" })
    );

    const dateStr = localDate.toISOString().split("T")[0];
    const time = localDate.toTimeString().slice(0, 5); // HH:mm

    if (!groupedByDate.has(dateStr)) {
      groupedByDate.set(dateStr, []);
    }
    groupedByDate.get(dateStr)!.push({ time, content: log.content });
  }

  const sortedDates = Array.from(groupedByDate.keys()).sort();

  let markdown = `# Log report: ${fromStr} → ${toStr}\n\n`;

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr + "T00:00:00");
    const weekday = WEEKDAYS[date.getDay()];
    markdown += `## ${dateStr}, ${weekday}\n`;

    const entries = groupedByDate.get(dateStr)!;
    for (const entry of entries) {
      markdown += `- ${entry.time} — ${entry.content}\n`;
    }
    markdown += "\n";
  }

  return markdown.trim();
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const days = interaction.options.getInteger("days") ?? 7;
  const userId = interaction.user.id;
  const reportChannelId = process.env.REPORT_CHANNEL_ID;

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - days);
  fromDate.setHours(0, 0, 0, 0);

  const toDate = new Date(now);
  toDate.setHours(23, 59, 59, 999);

  const fromIso = fromDate.toISOString().replace("T", " ").slice(0, 19);
  const toIso = toDate.toISOString().replace("T", " ").slice(0, 19);

  const logs = getLogsInRange({ userId, fromIso, toIso });

  // If no report channel configured, fall back to ephemeral reply
  if (!reportChannelId) {
    const markdown = formatReport(logs, fromDate, toDate);
    if (markdown.length <= 2000) {
      await interaction.reply({
        content: markdown,
        ephemeral: true,
      });
    } else {
      const attachment = new AttachmentBuilder(Buffer.from(markdown, "utf-8"), {
        name: "report.md",
      });
      await interaction.reply({
        content: "Report generated (attached):",
        files: [attachment],
        ephemeral: true,
      });
    }
    return;
  }

  // Reply immediately to prevent timeout
  await interaction.reply({
    content: "Generating report…",
    ephemeral: true,
  });

  // Check if there are any logs
  if (logs.length === 0) {
    await interaction.editReply("No entries in the selected range.");
    return;
  }

  // Generate the report markdown
  const markdown = formatReport(logs, fromDate, toDate);

  // Fetch the report channel
  let reportChannel;
  try {
    reportChannel = await interaction.client.channels.fetch(reportChannelId);
    if (!reportChannel || reportChannel.type !== ChannelType.GuildText) {
      throw new Error("Report channel is not a text channel");
    }
  } catch (error) {
    console.error("Failed to fetch report channel:", error);
    await interaction.editReply(
      "Error: Could not access report channel. Falling back to ephemeral reply."
    );

    // Fall back to ephemeral reply with the report
    if (markdown.length <= 2000) {
      await interaction.followUp({
        content: markdown,
        ephemeral: true,
      });
    } else {
      const attachment = new AttachmentBuilder(Buffer.from(markdown, "utf-8"), {
        name: "report.md",
      });
      await interaction.followUp({
        content: "Report generated (attached):",
        files: [attachment],
        ephemeral: true,
      });
    }
    return;
  }

  // Convert dates to Europe/Zurich timezone for thread name
  const fromLocalStr = new Date(
    fromDate.toLocaleString("en-US", { timeZone: "Europe/Zurich" })
  )
    .toISOString()
    .split("T")[0];
  const toLocalStr = new Date(
    toDate.toLocaleString("en-US", { timeZone: "Europe/Zurich" })
  )
    .toISOString()
    .split("T")[0];

  const threadName = `Report ${fromLocalStr} → ${toLocalStr}`;

  try {
    // Create the thread
    const thread = await reportChannel.threads.create({
      name: threadName,
      type: ChannelType.PublicThread,
      autoArchiveDuration: 10080, // 7 days
    });

    // Post the report in the thread
    if (markdown.length <= 2000) {
      await thread.send(markdown);
    } else {
      const attachment = new AttachmentBuilder(Buffer.from(markdown, "utf-8"), {
        name: "report.md",
      });
      await thread.send({
        content: "Report generated:",
        files: [attachment],
      });
    }

    // Update the ephemeral reply with a link to the thread
    await interaction.editReply(`Report ready: <#${thread.id}>`);
  } catch (error) {
    console.error("Failed to create thread or post report:", error);
    await interaction.editReply(
      "Error: Failed to create report thread. Check bot permissions."
    );
  }
}
