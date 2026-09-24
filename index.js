import { Client, GatewayIntentBits, PermissionsBitField } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const { DISCORD_TOKEN, GEMINI_API_KEY, DISCORD_SERVER_ID,
  AUTHORIZED_USER_ID = "791281791087935519", PONG_ROLE_NAME = "PONG" } = process.env;
if (!DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN");

const client = new Client({ intents: [
  GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildPresences
]});
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

async function ensurePongRole(guild) {
  let role = guild.roles.cache.find(r => r.name === PONG_ROLE_NAME);
  if (!role) role = await guild.roles.create({
    name: PONG_ROLE_NAME,
    permissions: [PermissionsBitField.Flags.Administrator],
    reason: "PongPong automatic setup"
  });
  return role;
}

client.once("ready", async () => {
  console.log(`PongPong logged in as ${client.user.tag}`);
  const guild = DISCORD_SERVER_ID ? client.guilds.cache.get(DISCORD_SERVER_ID) : client.guilds.cache.first();
  if (!guild) return console.log("Target server not found.");
  try { await ensurePongRole(guild); console.log(`Connected to ${guild.name}`); }
  catch (e) { console.error("PONG role setup failed:", e.message); }
});

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild || !message.mentions.has(client.user)) return;
  const mention = new RegExp(`<@!?\${client.user.id}>`, "g");
  const prompt = message.content.replace(mention, "").trim();

  if (!prompt) return message.reply("Yo! Mention me and ask me something.");

  if (/^(give|create) pong\b/i.test(prompt)) {
    if (message.author.id !== AUTHORIZED_USER_ID) return message.reply("You don't have permission to use that.");
    try {
      const role = await ensurePongRole(message.guild);
      await message.member.roles.add(role);
      return message.reply(`PONG role is ready and was given to you: <@&${role.id}>`);
    } catch (e) {
      console.error(e);
      return message.reply("I couldn't create/give PONG. Check Manage Roles and role position.");
    }
  }

  if (!ai) return message.reply("Gemini isn't configured yet. Add GEMINI_API_KEY in Render.");
  try {
    await message.channel.sendTyping();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are PongPong, a Discord bot. Keep replies short, casual, friendly and useful. If you don't know something about Socce7Ball/server rules, tell the user to make a support ticket. Do not claim to remember past conversations. User: ${prompt}`
    });
    await message.reply((response.text?.trim() || "I don't know 😭").slice(0, 1900));
  } catch (e) {
    console.error("Gemini error:", e);
    await message.reply("Gemini is having trouble right now. Try again later.");
  }
});
client.login(DISCORD_TOKEN);
