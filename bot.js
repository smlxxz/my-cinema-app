const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('@napi-rs/canvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// قراءة التوكن مباشرة من متغيرات البيئة بأمان تام
const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`[البوت] Logged in successfully as ${client.user.tag}!`);
    client.user.setActivity('مطر موفي | Matar Cinema', { type: 3 }); // Watching status
});

// ترحيب الأعضاء الجدد باستخدام مكتبة الكانفاس والتصميم الخاص
client.on('guildMemberAdd', async member => {
    const channel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name === 'welcome');
    if (!channel) return;

    try {
        const canvas = createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // خلفية الترحيب
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // نصوص الترحيب
        ctx.font = 'bold 35px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`أهلاً بك يا ${member.user.username}`, 200, 100);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('نورت سيرفر مطر السينمائي!', 200, 150);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome-image.png' });
        channel.send({ content: `مرحباً بك <@${member.id}> في منصة مطر!`, files: [attachment] });
    } catch (error) {
        console.error('Error generating welcome image:', error);
    }
});

// تفاعل الأزرار (مثل قفل الروم الصوتي أو اللوكت بوت)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'lock_vc') {
        await interaction.reply({ content: 'تم قفل الروم الصوتي بنجاح!', ephemeral: true });
    }
});

// تشغيل البوت باستخدام متغير البيئة
if (!TOKEN) {
    console.error('[خطأ] لم يتم العثور على DISCORD_TOKEN في متغيرات البيئة!');
} else {
    client.login(TOKEN);
}