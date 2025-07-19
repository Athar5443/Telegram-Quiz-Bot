const { Markup } = require('telegraf');
const { db, markAsDirty, loadAllDatabases } = require('./database');
const Quiz = require('./quiz_logic');
const config = require('./config');
const { escapeMarkdownV2 } = require('./utils');

function clearPendingQuizAction(ctx) {
    if (ctx.session?.nextQuestionTimeout) {
        clearTimeout(ctx.session.nextQuestionTimeout);
        ctx.session.nextQuestionTimeout = null;
    }
}

async function sendNewQuestion(ctx) {
    try {
        clearPendingQuizAction(ctx);
        const user = Quiz.getUser(ctx.from?.id);
        if (!user) return;
        
        const question = Quiz.getAdaptiveQuestion(ctx.from.id);

        if (!question) {
            ctx.session.currentQuestion = null;
            await ctx.reply('*Selamat\\!* Anda telah menyelesaikan semua soal yang ada\\.', { parse_mode: 'MarkdownV2' });
            return;
        }
        
        user.question_counter = (user.question_counter ?? 0) + 1;
        ctx.session.currentQuestion = question;
        markAsDirty();

        const optionButtons = Object.keys(question.pilihan).map(opt => 
            [Markup.button.callback(`${opt.toUpperCase()}. ${question.pilihan[opt]}`, `answer_${opt}`)]
        );
        
        const keyboard = Markup.inlineKeyboard([
            ...optionButtons,
            [Markup.button.callback('⏹️ Hentikan Kuis', 'stop_quiz')]
        ]);
        
        const safeUserName = escapeMarkdownV2(user.name);
        const safeQuestionText = escapeMarkdownV2(question.soal);
        const questionMessage = `*Soal No\\. ${user.question_counter} untuk ${safeUserName}:*\n\n${safeQuestionText}`;
        
        await ctx.reply(questionMessage, {
            parse_mode: 'MarkdownV2',
            reply_markup: keyboard.reply_markup
        });
    } catch (error) {
        console.error("❌ Gagal mengirim soal baru:", error);
        await ctx.reply('Maaf, terjadi kesalahan saat mencoba mengirim soal baru.');
    }
}

function registerHandlers(bot) {
    bot.catch((err, ctx) => {
        console.error(`❌ Global Error for user ${ctx.from?.id}:`, err);
        try {
            if (ctx?.reply) ctx.reply('Maaf, terjadi kesalahan tak terduga di server kami. Coba lagi nanti.');
        } catch (e) {
            console.error('❌ Gagal mengirim pesan error balasan:', e);
        }
    });

    bot.start(async (ctx) => {
        clearPendingQuizAction(ctx);
        const user = Quiz.getUser(ctx.from.id);
        const message = user 
            ? `*Halo kembali, ${escapeMarkdownV2(user.name)}\\!* 👋\n\nKetik /quiz untuk melanjutkan\\.`
            : 'Selamat datang di Kuis Bot\\! 🤖\n\nUntuk memulai, silakan ketik *nama lengkap Anda* sesuai yang terdaftar\\.';
        await ctx.reply(message, { parse_mode: 'MarkdownV2' });
    });

    bot.command('quiz', async (ctx) => {
        clearPendingQuizAction(ctx);
        const user = Quiz.getUser(ctx.from.id);
        if (!user) return ctx.reply('Anda belum terverifikasi. Silakan ketik nama lengkap Anda.');

        const available = db.questions.filter(q => !user.answeredQuestions?.includes(q.nomor));
        if (available.length === 0 && db.questions.length > 0) {
            user.answeredQuestions = [];
            user.question_counter = 0;
            user.rounds_completed = (user.rounds_completed ?? 0) + 1;
            user.current_round_score = 0;
            user.current_round_answered = 0;
            markAsDirty();
            
            const message = `🎉 *Luar Biasa, ${escapeMarkdownV2(user.name)}\\!* 🎉\n\nAnda telah menyelesaikan semua soal \\(ronde ke\\-${user.rounds_completed}\\)\\. Progres direset untuk memulai babak baru\\!`;
            await ctx.reply(message, { parse_mode: 'MarkdownV2' });
        }
        await sendNewQuestion(ctx);
    });

    bot.command('reset', async (ctx) => {
        clearPendingQuizAction(ctx);
        const user = Quiz.getUser(ctx.from.id);
        if (!user) return ctx.reply('Anda belum terverifikasi.');

        await ctx.reply(
            '⚠️ *Anda yakin ingin mereset semua progres Anda?* Aksi ini tidak dapat dibatalkan\\.',
            {
                parse_mode: 'MarkdownV2',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('Ya, Reset Progres Saya', 'confirm_reset'),
                    Markup.button.callback('Tidak, Batalkan', 'cancel_reset')
                ])
            }
        );
    });

    bot.command('help', async (ctx) => {
        await ctx.reply(
            `*Bantuan Kuis Bot* 🤖\n\n` +
            `Berikut adalah daftar perintah yang bisa Anda gunakan:\n` +
            `/start \\- Memulai atau menyapa bot\\.\n` +
            `/quiz \\- Memulai atau melanjutkan sesi kuis\\.\n` +
            `/stats \\- Melihat statistik pribadi Anda\\.\n` +
            `/leaderboard \\- Menampilkan 10 pemain dengan skor tertinggi\\.\n` +
            `/reset \\- Mereset semua progres kuis Anda\\.\n`,
            { parse_mode: 'MarkdownV2' }
        );
    });
    
    bot.command('stats', async (ctx) => {
        const user = Quiz.getUser(ctx.from.id);
        if (!user) return ctx.reply('Anda belum terverifikasi untuk melihat statistik.');
        const statsText = Quiz.generateUserStatsText(user);
        await ctx.reply(statsText, { parse_mode: 'MarkdownV2' });
    });

    bot.command('leaderboard', async (ctx) => {
        const topUsers = Quiz.getLeaderboard();
        if (topUsers.length === 0) {
            return ctx.reply('Papan peringkat masih kosong. Jadilah yang pertama!');
        }

        let leaderboardText = '🏆 *Papan Peringkat Top 10*\n\n';
        const medal = ['🥇', '🥈', '🥉'];
        topUsers.forEach((user, index) => {
            const rank = medal[index] || ` ${index + 1}\\.`;
            const accuracy = user.questions_answered > 0 ? (user.total_score / user.questions_answered * 100).toFixed(1) : 0;
            leaderboardText += `${rank} *${escapeMarkdownV2(user.name)}* \\- Skor: ${user.total_score} \\(${escapeMarkdownV2(accuracy)}%\\)\n`;
        });

        await ctx.reply(leaderboardText, { parse_mode: 'MarkdownV2' });
    });

    bot.command('reload', async (ctx) => {
        if (String(ctx.from.id) !== config.ADMIN_ID) return;
        clearPendingQuizAction(ctx);
        try {
            await ctx.reply('Memuat ulang database...');
            loadAllDatabases();
            await ctx.reply('✅ Database berhasil dimuat ulang!');
        } catch (error) {
            await ctx.reply(`❌ Gagal memuat ulang: ${escapeMarkdownV2(error.message)}`, { parse_mode: 'MarkdownV2' });
        }
    });

    bot.on('text', async (ctx) => {
        if (ctx.message.text.startsWith('/') || Quiz.getUser(ctx.from.id)) return;
        clearPendingQuizAction(ctx);

        const profileId = Quiz.findUserProfileByName(ctx.message.text);
        if (profileId) {
            const userProfile = db.users[profileId];
            if (userProfile.user_id) {
                return await ctx.reply('❌ Nama ini sudah ditautkan ke akun Telegram lain.');
            }
            userProfile.user_id = ctx.from.id;
            db.usersByTgId[ctx.from.id] = userProfile;
            markAsDirty();
            const message = `✅ *Verifikasi Berhasil\\!*\n\nAnda masuk sebagai *${escapeMarkdownV2(userProfile.name)}*\\.\nKetik /quiz untuk mulai atau /help untuk bantuan\\.`;
            await ctx.reply(message, { parse_mode: 'MarkdownV2' });
        } else {
            await ctx.reply('❌ Nama tidak ditemukan. Pastikan Anda mengetik nama lengkap (atau salah satu kata dari nama Anda) dengan benar.');
        }
    });

    bot.action('confirm_reset', async (ctx) => {
        const user = Quiz.getUser(ctx.from.id);
        if (!user) return await ctx.answerCbQuery('Sesi tidak valid.', { show_alert: true });
        
        user.total_score = 0;
        user.questions_answered = 0;
        user.rounds_completed = 0;
        user.current_round_score = 0;
        user.current_round_answered = 0;
        user.answeredQuestions = [];
        user.question_counter = 0;
        user.rating = config.QUIZ_SETTINGS.STARTING_RATING;
        markAsDirty();

        await ctx.editMessageText('🔄 *Progres Anda telah berhasil direset total\\!*', { parse_mode: 'MarkdownV2' });
        await ctx.reply('Ketik /quiz untuk memulai dari awal.');
    });
    
    bot.action('cancel_reset', async (ctx) => {
        await ctx.editMessageText('Aksi dibatalkan\\. Progres Anda aman\\. 👍', { parse_mode: 'MarkdownV2' });
    });

    bot.action('stop_quiz', async (ctx) => {
        clearPendingQuizAction(ctx);
        ctx.session.currentQuestion = null;
        
        const user = Quiz.getUser(ctx.from.id);
        if (user) {
            user.question_counter = Math.max(0, (user.question_counter ?? 1) - 1);
            markAsDirty();
        }

        await ctx.answerCbQuery('Kuis dihentikan.');
        await ctx.editMessageText('Sesi kuis telah Anda hentikan\\. Ketik /quiz untuk memulai lagi kapan saja\\.', { parse_mode: 'MarkdownV2' });

        if (user) {
            await ctx.reply(Quiz.generateUserStatsText(user), { parse_mode: 'MarkdownV2' });
        }
    });

    bot.action(/answer_(.+)/, async (ctx) => {
        if (ctx.session.isProcessing) {
            return ctx.answerCbQuery('Harap tunggu...');
        }

        try {
            ctx.session.isProcessing = true;
            await ctx.answerCbQuery();
            
            const { session, match, from } = ctx;
            const user = Quiz.getUser(from.id);
            const question = session.currentQuestion;

            if (!user || !question) {
                await ctx.editMessageText('Sesi kuis sudah berakhir atau tidak valid\\.', { parse_mode: 'MarkdownV2' });
                return;
            }
            
            session.currentQuestion = null;
            const isCorrect = match[1] === question.jawaban_benar;

            if (!user.answeredQuestions?.includes(question.nomor)) {
                user.answeredQuestions.push(question.nomor);
            }
            
            Quiz.updateUser(from.id, isCorrect);
            Quiz.recordAnswer(from.id, question, match[1], isCorrect);
            
            const correctText = escapeMarkdownV2(`${question.jawaban_benar.toUpperCase()}. ${question.pilihan[question.jawaban_benar]}`);
            const feedback = isCorrect 
                ? `✅ *Benar\\!*` 
                : `❌ *Salah\\!*\nJawaban benar:\n*${correctText}*`;
            
            const statsText = Quiz.generateUserStatsText(user);
            const explanationText = escapeMarkdownV2(question.penjelasan);
            
            const responseText = `${feedback}\n\n_${explanationText}_\n\n${statsText}\n\n🔄 Memuat soal berikutnya\\.\\.\\.`;
            
            await ctx.editMessageText(responseText, { parse_mode: 'MarkdownV2' });
            
            session.nextQuestionTimeout = setTimeout(() => sendNewQuestion(ctx), 2500);

        } catch (error) {
            console.error('❌ Terjadi error pada action handler:', error);
        } finally {
            ctx.session.isProcessing = false;
        }
    });
    
    bot.on('message', (ctx) => {
         clearPendingQuizAction(ctx);
    });
}

module.exports = registerHandlers;
