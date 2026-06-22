import { Interaction } from "discord.js";
import { commands } from "../commands/index.js";

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isAutocomplete()) {
    const command = commands.find((cmd) => cmd.data.name === interaction.commandName);

    if (!command?.autocomplete) {
      console.warn(`No autocomplete handler for: ${interaction.commandName}`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Autocomplete error for ${interaction.commandName}:`, error);
      try {
        await interaction.respond([]);
      } catch {
        // Interaction may already be expired
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.find((cmd) => cmd.data.name === interaction.commandName);

  if (!command) {
    console.warn(`Unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: "Unknown command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    const errorMessage = { content: "Something went wrong.", ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}