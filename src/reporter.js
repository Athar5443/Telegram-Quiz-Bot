const axios = require('axios');
const { db } = require('./database');
const config = require('./config');
const { escapeMarkdownV2 } = require('./utils');

async function sendStatsToDiscord() {
    if (!config.DISCORD_WEBHOOK_URL) return;

    console.log('[REPORTER] Mengumpulkan statistik untuk dikirim ke Discord...');
    const allUsers = Object.values(db.users);
    if (allUsers.length === 0) return console.log('[REPORTER] Tidak ada pengguna, laporan dilewati.');
    
    const activePlayers = allUsers.filter(u => u.user_id && u.questions_answered > 0);

    const stats = activePlayers.reduce((acc, user) => {
        acc.totalAnswered += user.questions_answered ?? 0;
        acc.totalCorrect += user.total_score ?? 0;
        if (db.questions.length > 0 && (user.answeredQuestions ?? []).length === db.questions.length) {
            acc.usersFinished++;
        }
        return acc;
    }, { totalAnswered: 0, totalCorrect: 0, usersFinished: 0 });

    const accuracy = stats.totalAnswered > 0 ? ((stats.totalCorrect / stats.totalAnswered) * 100).toFixed(2) : "0.00";

 //daftar siswa yang udah ngerjain :P
    let playerListString = activePlayers.length > 0 
        ? activePlayers.map(p => p.name).join(', ') 
        : 'Belum ada yang bermain.';
    
    if (playerListString.length > 1024) {
        playerListString = playerListString.substring(0, 1020) + '...';
    }
    
    const embed = {
        color: 0x0099ff,
        title: 'Laporan Aktivitas Kuis Bot',
        description: `Ringkasan aktivitas dari semua pengguna terdaftar.`,
        fields: [
            { name: '👥 Pengguna Terdaftar', value: `**${allUsers.length}**`, inline: true },
            { name: '🎮 Pemain Aktif', value: `**${activePlayers.length}**`, inline: true },
            { name: '📚 Total Soal', value: `**${db.questions.length}**`, inline: false },
            { name: '☑️ Jawaban Terkirim', value: `**${stats.totalAnswered}**`, inline: true },
            { name: '🎯 Akurasi Global', value: `**${accuracy}%**`, inline: true },
            { name: '🏆 Pengguna Selesai', value: `**${stats.usersFinished}**`, inline: true },
            { name: '👤 siswa', value: playerListString, inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Laporan Otomatis' },
    };

    try {
        await axios.post(config.DISCORD_WEBHOOK_URL, { username: 'Quiz Bot Reporter', embeds: [embed] });
        console.log('[REPORTER] ✅ Laporan statistik berhasil dikirim ke Discord!');
    } catch (error) {
        console.error('❌ [REPORTER] Gagal mengirim laporan ke Discord:', error.response?.data ?? error.message);
    }
}

module.exports = { sendStatsToDiscord };