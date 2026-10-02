import { Client, GatewayIntentBits, PermissionsBitField, REST, Routes, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const { DISCORD_TOKEN, GEMINI_API_KEY, DISCORD_SERVER_ID,
  AUTHORIZED_USER_ID = "791281791087935519",
  SHAYAN_ROLE_NAME = "SHAYAN",
  BOT_ROLE_ID = "" } = process.env;
if (!DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN");

const client = new Client({ intents: [
  GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildPresences
]});
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function getPongRole(guild) {
  let role = guild.roles.cache.find(r => r.name === SHAYAN_ROLE_NAME);
  if (!role) {
    role = await guild.roles.create({
      name: SHAYAN_ROLE_NAME,
      permissions: []
    });
  }
  return role;
}

client.once("ready", async () => {
  console.log(`Shayan logged in as ${client.user.tag}`);
  const guild = DISCORD_SERVER_ID ? client.guilds.cache.get(DISCORD_SERVER_ID) : client.guilds.cache.first();
  if (!guild) return console.log("Target server not found.");
  try {
    const role = await getPongRole(guild);
    console.log(`SHAYAN role ready: ${role.id}`);
    console.log("Bot role ID:", guild.members.me?.roles.botRole?.id || "not found");
  } catch (e) {
    console.error("SHAYAN role setup failed:", e.message);
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.mentions.has(client.user)) return;
  const mention = new RegExp(`<@!?${client.user.id}>`, "g");
  if (!message.guild.members.me?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("❌ **Shayan has no permission**\nShayan needs the **Administrator** permission to work in this server.");
  }

  const prompt = message.content.replace(mention, "").trim();

  if (!prompt) return message.reply("Yo! Mention me and ask me something.");

  if (/^(give|create) pong\b/i.test(prompt)) {
    if (message.author.id !== AUTHORIZED_USER_ID) return message.reply("You don't have permission to use that.");
    try {
      const role = await getPongRole(message.guild);
      await message.member.roles.add(role);
      return message.reply(`SHAYAN role is ready and was given to you: <@&${role.id}>`);
    } catch (e) {
      console.error(e);
      return message.reply("I couldn't give SHAYAN. Make sure my bot role is above SHAYAN and I have Manage Roles.");
    }
  }

  if (!ai) return message.reply("Gemini isn't configured yet. Add GEMINI_API_KEY in Render.");
  try {
    await message.channel.sendTyping();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are Shayan, a Discord bot. Keep replies short, casual, friendly and useful. If you don't know something about Socce7Ball/server rules, tell the user to make a support ticket. Do not claim to remember past conversations. User: ${prompt}`
    });
    await message.reply((response.text?.trim() || "I don't know 😭").slice(0, 1900));
  } catch (e) {
    console.error("Gemini error:", e);
    await message.reply("Gemini is having trouble right now. Try again later.");
  }
});


const slashCommands = [
  new SlashCommandBuilder().setName("bonk").setDescription("Bonk someone").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("slap").setDescription("Slap someone").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("yeet").setDescription("Yeet someone").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("sus").setDescription("Check suspiciousness").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("drip").setDescription("Check drip").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("aura").setDescription("Check aura").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("yap").setDescription("Check yap level").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("cooked").setDescription("Check how cooked someone is").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("roast").setDescription("Roast someone").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("compliment").setDescription("Compliment someone").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder().setName("gamble").setDescription("Gamble fake coins"),
  new SlashCommandBuilder().setName("skillcheck").setDescription("Random skill check"),
  new SlashCommandBuilder().setName("fortune").setDescription("Random fortune"),
  new SlashCommandBuilder().setName("court").setDescription("Put someone on trial").addUserOption(o => o.setName("user").setDescription("Target").setRequired(true)),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Get a user's Discord profile picture")
    .addUserOption(option =>
      option.setName("user").setDescription("The user whose avatar you want").setRequired(false)
    )
].map(command => command.toJSON());

async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    console.log("Registered Shayan commands");
  } catch (e) {
    console.error("Slash command registration failed:", e.message);
  }
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.guild && !interaction.guild.members.me?.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ **Shayan has no permission**\nShayan needs the **Administrator** permission to work in this server.", ephemeral: true });
  }
  const target = interaction.options.getUser("user") || interaction.user;
  const value = Math.floor(Math.random() * 201) - 100;
  const funny = {
    bonk: ["BONK! Direct hit.", "The bonk missed.", "Critical bonk! -999 dignity."],
    slap: ["Massive slap.", "Tiny slap.", "The slap backfired."],
    yeet: ["Successfully yeeted.", "Yeet failed.", "Shayan got yeeted instead."],
    sus: ["Completely innocent.", "Very suspicious.", "The evidence is terrible."],
    drip: ["Absolute drip.", "Average drip.", "Fashion emergency."],
    aura: ["Infinite aura.", "Positive aura.", "Aura is in debt."],
    yap: ["Silent legend.", "Certified yapper.", "THE YAP WILL NOT STOP."],
    cooked: ["Not cooked.", "Slightly cooked.", "Absolutely cooked."],
    roast: ["Light roast.", "Absolutely destroyed.", "Shayan got roasted instead."],
    compliment: ["Huge compliment.", "Nice compliment.", "Backhanded compliment."],
    gamble: ["JACKPOT!", "Small win.", "You lost everything."],
    skillcheck: ["CRITICAL SUCCESS!", "Success.", "CATASTROPHIC FAILURE."],
    fortune: ["Amazing future.", "Questionable future.", "Your future has been canceled."],
    court: ["GUILTY — 3,742 years of Discord jail.", "NOT GUILTY — free to go.", "The judge has no idea what happened."]
  };
  if (funny[interaction.commandName]) {
    let line = funny[interaction.commandName][Math.floor(Math.random() * funny[interaction.commandName].length)];
    if (Math.random() < 0.001) line = "☠️ 0.1% CHAOS EVENT — Shayan has made a terrible mistake. EVERYONE IS NOW ON TRIAL.";
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("Shayan " + interaction.commandName.toUpperCase())
        .setDescription("**" + (target.globalName || target.username) + "** — " + line)
        .addFields({ name: "Random result", value: String(value), inline: true })
        .setColor(value < 0 ? 0xed4245 : 0x5865f2)]
    });
  }

  if (interaction.commandName !== "avatar") return;

  const user = interaction.options.getUser("user") || interaction.user;
  const png = user.displayAvatarURL({ extension: "png", size: 1024 });
  const gif = user.displayAvatarURL({ extension: "gif", size: 1024 });

  const embed = new EmbedBuilder()
     .setTitle((user.globalName || user.username) + "'s Avatar")
    .setImage(gif)
    .setColor(0x5865F2)
    .setFooter({ text: "Requested by " + interaction.user.username });

  await interaction.reply({
    embeds: [embed],
    content: "[Open avatar](" + png + ")"
  });
});

client.once("ready", async () => {
  await registerSlashCommands();
});

client.login(DISCORD_TOKEN);
