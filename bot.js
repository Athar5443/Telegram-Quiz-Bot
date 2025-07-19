const { Telegraf, session } = require('telegraf');
const cron = require('node-cron');
const config = require('./src/config');
const { loadAllDatabases, scheduleDbSave } = require('./src/database');
const registerHandlers = require('./src/handlers');
const { sendStatsToDiscord } = require('./src/reporter');

async function main() {
    const bot = new Telegraf(config.BOT_TOKEN);
    bot.use(session({ defaultSession: () => ({ currentQuestion: null }) }));

    try {
        console.log('🚀 Memulai bot...');
        loadAllDatabases();
        
        setInterval(scheduleDbSave, config.QUIZ_SETTINGS.DB_SAVE_INTERVAL_MS);
        
        if (config.DISCORD_WEBHOOK_URL && config.STATS_CRON_SCHEDULE) {
            console.log(`[PENJADWAL] 🕒 Laporan ke Discord dijadwalkan dengan pola: "${config.STATS_CRON_SCHEDULE}"`);
            cron.schedule(config.STATS_CRON_SCHEDULE, sendStatsToDiscord);
        }
        
        registerHandlers(bot);

        await bot.launch();
        console.log(`✅ Bot berhasil dijalankan sebagai @${bot.botInfo.username}`);
        
    } catch (error) {
        console.error('❌ FATAL: Gagal total saat menjalankan bot:', error);
        process.exit(1);
    }

    process.once('SIGINT', () => { console.log("🛑 Bot berhenti..."); bot.stop('SIGINT') });
    process.once('SIGTERM', () => { console.log("🛑 Bot berhenti..."); bot.stop('SIGTERM') });
}

main();