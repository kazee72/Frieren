import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import si from "systeminformation";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

function loadBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  return `[${"█".repeat(filled)}${"░".repeat(10 - filled)}] ${percentage.toFixed(1)}%`;
}

export const data = new SlashCommandBuilder()
  .setName("uptime")
  .setDescription("Show host CPU load, memory, disk usage, and uptime");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const [load, mem, disk, osInfo, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.time(),
    ]);

    const cpuPercent = load.currentLoad ?? 0;
    const memPercent = (mem.used / mem.total) * 100;
    const diskPercent = Math.max(...disk.map((d) => d.use ?? 0));
    const usedDisk = disk.reduce((sum, d) => sum + (d.used ?? 0), 0);
    const totalDisk = disk.reduce((sum, d) => sum + (d.size ?? 0), 0);

    const embed = new EmbedBuilder()
      .setTitle("🖥️ Host Status")
      .setColor(0x5865f2)
      .setTimestamp()
      .addFields(
        { name: "Hostname", value: `\`${osInfo.hostname}\``, inline: true },
        { name: "Uptime", value: `\`${formatUptime(time.uptime)}\``, inline: true },
        { name: "Platform", value: `\`${osInfo.platform} ${osInfo.release}\``, inline: true },
        { name: "CPU Load", value: loadBar(cpuPercent), inline: false },
        { name: "Memory", value: `${loadBar(memPercent)}\n\`${formatBytes(mem.used)} / ${formatBytes(mem.total)}\``, inline: false },
        { name: "Disk", value: `${loadBar(diskPercent)}\n\`${formatBytes(usedDisk)} / ${formatBytes(totalDisk)}\``, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to gather host stats:", error);
    await interaction.editReply("Failed to gather host statistics.");
  }
}