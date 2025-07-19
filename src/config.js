require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const config = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    ADMIN_ID: process.env.ADMIN_ID,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    STATS_CRON_SCHEDULE: process.env.STATS_CRON_SCHEDULE,
    
    DB_FILES: {
        USERS: './users.json',
        QUESTIONS: './soal.json',
        ANSWERS: './jawaban.json',
    },

    QUIZ_SETTINGS: {
        STARTING_RATING: 1,
        DB_SAVE_INTERVAL_MS: 1000,
    },
};

if (!config.BOT_TOKEN) {
    console.error("❌ FATAL: BOT_TOKEN tidak ditemukan di file .env! Bot tidak bisa berjalan.");
    process.exit(1);
}

module.exports = config;