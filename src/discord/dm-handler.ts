import type { Message } from "discord.js";

export async function handleDMMessage(message: Message): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!message.channel.isDMBased()) {
    return;
  }

  // Dormant — ignore all DMs silently for now
  return;
}
