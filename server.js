require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- جلب مكتبة ضخمة جداً (+20 صفحة لكل تصنيف لضمان آلاف الأفلام والمسلسلات) ---
app.get('/api/media', async (req, res) => {
    try {
        let allResults = [];
        const totalPages = 20; // زيادة عدد الصفحات لتعبئة الموقع بآلاف الأعمال

        for (let page = 1; page <= totalPages; page++) {
            const endpoints = [
                `https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=ar&page=${page}`,
                `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=ar&page=${page}`,
                `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=ar&page=${page}`,
                `https://api.themoviedb.org/3/movie/upcoming?api_key=${TMDB_API_KEY}&language=ar&page=${page}`,
                `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=ar&page=${page}`,
                `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=ar&page=${page}`
            ];

            for (const url of endpoints) {
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.results) {
                        // استبعاد الأنمي (تصنيف 16) تماماً
                        const filtered = data.results.filter(item => {
                            const genres = item.genre_ids || [];
                            return !genres.includes(16);
                        });
                        allResults = allResults.concat(filtered);
                    }
                } catch (e) {
                    // تجاهل أي خطأ مؤقت
                }
            }
        }

        // إزالة التكرار
        const uniqueMedia = Array.from(new Map(allResults.map(item => [item.id, item])).values());
        res.json(uniqueMedia);
    } catch (err) {
        console.error("خطأ في جلب بيانات TMDB:", err);
        res.status(500).json({ error: "خطأ في الاتصال" });
    }
});

// --- بوت ديسكورد ---
if (DISCORD_TOKEN) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ]
    });

    client.once('ready', () => {
        console.log(`🤖 بوت ديسكورد متصل بنجاح باسم: ${client.user.tag}`);
    });

    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        if (message.content === '!سينما') {
            const serverIcon = message.guild ? message.guild.iconURL({ dynamic: true }) : null;
            const bannerImage = 'https://cdn.discordapp.com/attachments/1553789592082190456/1554782863189213194/025086C0-F5D2-489F-B86C-047415D56D8B.png?backend=b2&ex=6abe23e1&is=6abcd261&hm=09853e0336e0fb098ccb5e9dde52a4dd1baa79821bbc64161156cbcc5068302e&';

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setAuthor({ name: message.guild ? message.guild.name : 'منصة السينما', iconURL: serverIcon })
                .setDescription('**🎬 منصة السينما الجماعية (مَطَر)**\n\nاضغط على الزر بالأسفل لفتح منصة الأفلام والمسلسلات ومشاهدتها بالترجمة العربية بجودة عالية!')
                .setImage(bannerImage);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('مشاهدة / Watch')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`http://localhost:${PORT}`)
                );

            try {
                await message.delete().catch(() => {});
                await message.channel.send({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error('حدث خطأ أثناء إرسال رسالة السينما:', error);
            }
        }
    });

    client.login(DISCORD_TOKEN).catch(err => {
        console.error('❌ فشل تسجيل دخول بوت ديسكورد:', err);
    });
}

app.listen(PORT, () => {
    console.log(`🚀 موقع مَطَر يعمل على http://localhost:${PORT}`);
});