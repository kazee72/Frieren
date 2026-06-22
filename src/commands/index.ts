import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import * as ping from "./ping.js";
import * as status from "./status.js";
import * as uptime from "./uptime.js";
import * as start from "./start.js";
import * as stop from "./stop.js";
import * as restart from "./restart.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const commands: Command[] = [
  ping,
  status,
  uptime,
  start,
  stop,
  restart,
];