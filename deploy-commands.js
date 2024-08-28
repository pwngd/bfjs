const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientId = "990731538754830356";
const guildId = "981386845734703104";
const token = process.env.DISCORD_TOKEN;

const commands = [
  new SlashCommandBuilder().setName("bannedkeys").setDescription("Get the amount of currently banned keys"),
  new SlashCommandBuilder().setName("leave").setDescription("Leave VC"),
  new SlashCommandBuilder().setName("freebloxflipjs").setDescription("Redeem free bloxflipjs!"),
  new SlashCommandBuilder().setName("say").setDescription("Make bot say something").addStringOption(option => option.setName("input").setDescription("Say...").setRequired(true)),
  new SlashCommandBuilder().setName("play").setDescription("Play a youtube video in vc").addStringOption(option => option.setName("url").setDescription("youtube link").setRequired(true))
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();