import { Client, GatewayIntentBits, Events, REST, Routes } from "discord.js";
import { config } from "dotenv";
import { commands } from "./commands/index.js";
import { migrate } from "./db/schema.js";
import { handleInteraction } from "./discord/handler.js";

config();

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
  console.error(
    "Error: Missing required environment variables (DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID)"
  );
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, handleInteraction);

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!);
  const commandsData = commands.map((command) => command.data.toJSON());

  console.log(`Registering ${commandsData.length} command(s) to guild ${DISCORD_GUILD_ID}...`);

  await rest.put(
    Routes.applicationGuildCommands(DISCORD_CLIENT_ID!, DISCORD_GUILD_ID!),
    {
      body: commandsData,
    }
  );

  console.log("Successfully registered application commands.");
}

async function startup() {
  migrate();
  await registerCommands();
  await client.login(DISCORD_TOKEN!);
}

startup().catch((error) => {
  console.error("Error during startup:", error);
  process.exit(1);
});
