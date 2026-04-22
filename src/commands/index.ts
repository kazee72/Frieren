import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong and latency"),
];
