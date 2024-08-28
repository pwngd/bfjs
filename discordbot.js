const { readFile } = require("fs");
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType, demuxProbe, AudioPlayerStatus, generateDependencyReport } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const deployCommands = require("./deploy-commands");
const token = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });
const sleep = (ms = 1000) => new Promise(r => setTimeout(r, ms));

client.once("ready", ()=>{
  console.log("Bot online!");
});

client.on("messageCreate", async message => {
  if (message.author.bot) return false; 
  if (message.channel.id == "1004510823500230728" && (message.attachments.size == 0 && message.embeds.length == 0 && message.stickers.size == 0)) {
    message.member.send({ embeds:[embed("Denied", "You can only send media in this channel!")] });
    await sleep();
    message.delete();
  }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const { commandName } = interaction;
  
  switch (commandName) {
    case "bannedkeys":
      await interaction.deferReply();
      readFile(`${__dirname}/db.json`, "utf8", async (err, data)=>{
        if (err) await interaction.reply({ embeds:[embed("Operation Failed")] });
        const keys = JSON.parse(data).apiKeys;
        let count = 0;
        for (let k in keys) if(keys[k].banned) count+=1;
        await interaction.editReply({ embeds:[embed(`There are ${count} banned keys`)] });
      });
      break;
    case "say":
      const string = interaction.options.getString("input");
      await interaction.reply({ embeds:[embed(string)] });
      break;
    case "freebloxflipjs":
      const row = new MessageActionRow()
        .addComponents(
          new MessageButton()
					  .setCustomId('primary')
					  .setLabel('Redeem')
					  .setStyle('SUCCESS'),
			);
      const filter = i => i.customId === "primary" && i.user.id === interaction.user.id;
      await interaction.reply({ embeds:[embed("Free BloxflipJS key", "Generating...")] });
      await sleep(4000);
      await interaction.editReply({ content:"Redeem your key!", embeds:[embed("Free BloxflipJS key.", "Redeem your lifetime BloxflipJS key!")], components: [row] });
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
      collector.on("collect", async i => {
        if (i.customId === "primary") {
          await interaction.followUp({ embeds:[embed(":rofl:", "u fell for it!")], ephemeral:true });
          /*
          const replyFilter = m => m.author.id === interaction.user.id;
          interaction.channel.awaitMessages(filter, {max: 1,time: 30000,errors: ['time']})
          .then(message => {
            interaction.guild.invites.fetch(message.content)
              .then(invite => {
                if (invite.inviter.id !== interaction.user.id) return;
                if (invite.uses < 10) return;
              }).catch(console.error);
          }).catch(collected => {interaction.channel.send("Timeout");});
          */
        }
      });
      break;
      
    case "play":
      interaction.reply({ embeds:[embed("Loading", "Currently loading your video...")] });
      const channel = client.channels.cache.get(interaction.member.voice.channel.id);
      const url = interaction.options.getString("url");
      if (channel && url) {
        try {
        const stream = ytdl(url, { filter: "audioonly" });
        const resource = await probeAndCreateResource(stream);
        const player = createAudioPlayer();
        joinVoiceChannel({channelId: channel.id,guildId: interaction.guild.id,adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: false}).subscribe(player);
        player.play(resource);
        interaction.editReply({ embeds:[embed("Connected", "I joined your VC :wave:")] });
        } catch (err) {}
      } else {
        interaction.editReply({ embeds:[embed("Error", "Your not in a Voice Channel!")] });
      }
      break;
    case "leave":
      const connection = getVoiceConnection("981386845734703104");
      if (connection) {
        connection.destroy();
        interaction.reply({ embeds:[embed("Bye :wave:")] });
      } else {
        interaction.reply({ embeds:[embed("Im not in a vc :question:")] });
      }
      break;
  }
});

client.login(token);

module.exports.sendMessage = function(msg, to){
  client.guilds.cache.get("981386845734703104").channels.cache.get(to).send(msg);
}

async function probeAndCreateResource(readableStream) {
	const { stream, type } = await demuxProbe(readableStream);
	return createAudioResource(stream, { inputType: type });
}

function embed(title, text, footer, color, thumbnail){
	color=color||"#FF0808";
	var embed = new MessageEmbed()
		.setColor(color)
		.setTitle(title)
		.setAuthor("BloxflipJS", "https://i.imgur.com/EQLIhWj.png", "https://bloxflipjs.glitch.me/")
		.setTimestamp()
		
  if (thumbnail) embed.setThumbnail(thumbnail);
	if (text) embed.setDescription(text);

	return embed;
}