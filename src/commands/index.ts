import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import * as ping from "./ping.js";
import * as log from "./log.js";
import * as report from "./report.js";
import * as testReminder from "./test-reminder.js";
import * as clear from "./clear.js";
import * as links from "./links.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [ping, log, report, testReminder, clear, links];
