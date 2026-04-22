import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { commands } from "../commands/index.js";

config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error(
    "Error: Missing required environment variables (DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID)"
  );
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

const commandsData = commands.map((command) => command.toJSON());

console.log(`Registering ${commandsData.length} command(s) to guild ${DISCORD_GUILD_ID}...`);

rest
  .put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), {
    body: commandsData,
  })
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch((error) => {
    console.error("Error registering commands:", error);
    process.exit(1);
  });
