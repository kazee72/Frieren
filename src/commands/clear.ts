import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Delete all messages in a specified channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to clear")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("channel", true);

  // Check if it's a text channel
  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "That's not a text channel.",
      ephemeral: true,
    });
    return;
  }

  // Check bot permissions
  const textChannel = channel as TextChannel;
  const botPermissions = textChannel.permissionsFor(interaction.client.user!);

  if (!botPermissions?.has(PermissionFlagsBits.ManageMessages)) {
    await interaction.reply({
      content: "I don't have permission to delete messages in that channel.",
      ephemeral: true,
    });
    return;
  }

  // Create confirmation buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId(`clear_confirm:${channel.id}:${interaction.user.id}:${Date.now()}`)
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId(`clear_cancel:${channel.id}:${interaction.user.id}:${Date.now()}`)
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

  await interaction.reply({
    content: `Are you sure you want to delete all messages in <#${channel.id}>? This can't be undone.`,
    components: [row],
    ephemeral: true,
  });
}
