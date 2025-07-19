const { db, markAsDirty } = require('./database');
const config = require('./config');
const { escapeMarkdownV2 } = require('./utils');

const Quiz = {
    getUser: (telegramId) => db.usersByTgId[telegramId] || null,

    updateUser: (telegramId, isCorrect) => {
        const user = Quiz.getUser(telegramId);
        if (!user) return;

        user.questions_answered++;
        user.current_round_answered++;
        
        if (isCorrect) {
            user.total_score++;
            user.current_round_score++;
            user.rating = Math.min(user.rating + 1, db.maxDifficulty);
        } else {
            user.rating = Math.max(user.rating - 1, 1);
        }
        markAsDirty();
    },

    getAdaptiveQuestion: (telegramId) => {
        const user = Quiz.getUser(telegramId);
        if (!user) return null;
        
        const unanswered = db.questions.filter(q => !user.answeredQuestions.includes(q.nomor));
        if (unanswered.length === 0) return null;

        const findRandomFromPool = (pool) => pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

        let pool = unanswered.filter(q => q.tingkat_kesulitan === user.rating);
        let question = findRandomFromPool(pool);
        if (question) return question;
        
        pool = unanswered.filter(q => Math.abs(q.tingkat_kesulitan - user.rating) === 1);
        question = findRandomFromPool(pool);
        if (question) return question;

        return findRandomFromPool(unanswered);
    },

    recordAnswer: (telegramId, question, userAnswer, isCorrect) => {
        const user = Quiz.getUser(telegramId);
        if (!user || !question) return;
        
        db.answers.push({
            userId: telegramId, userName: user.name,
            nomorSoalAsli: question.nomor, soal: question.soal,
            jawabanPengguna: userAnswer, statusJawaban: isCorrect ? 'Benar' : 'Salah',
            waktu: new Date().toISOString()
        });
        markAsDirty();
    },

    generateUserStatsText: (user) => {
        const { 
            current_round_score, current_round_answered, 
            total_score, questions_answered, 
            answeredQuestions, rating, rounds_completed 
        } = user;

        const roundAccuracy = current_round_answered > 0 
            ? ((current_round_score / current_round_answered) * 100).toFixed(1) 
            : '0.0';
            
        const overallAccuracy = questions_answered > 0 
            ? ((total_score / questions_answered) * 100).toFixed(1) 
            : '0.0';

        const safeUserName = escapeMarkdownV2(user.name);
        let statsText = `*Statistik untuk ${safeUserName}*\n\n` +
                        `*📊 Ronde Ini:*\n` +
                        `• Skor Ronde: ${current_round_score}/${current_round_answered} \\(${escapeMarkdownV2(roundAccuracy)}%\\)\n` +
                        `• Progres Soal: ${answeredQuestions.length}/${db.questions.length} soal\n` +
                        `• Peringkat Kemampuan: ${rating}\n\n` +
                        `*🏆 Keseluruhan:*\n` +
                        `• Total Skor: ${total_score} dari ${questions_answered} soal\n` +
                        `• Akurasi Total: ${escapeMarkdownV2(overallAccuracy)}%\n` +
                        `• Ronde Selesai: ${rounds_completed ?? 0} kali`;
                        
        return statsText;
    },

    findUserProfileByName: (inputName) => {
        if (!inputName) return null;
        const trimmedInput = inputName.trim().toLowerCase();

        return Object.keys(db.users).find(id => {
            const userProfile = db.users[id];
            
            if (userProfile.user_id || !userProfile.name) {
                return false;
            }

            const fullName = userProfile.name.toLowerCase();
            const nameParts = fullName.split(' ');

            if (trimmedInput === fullName || nameParts.includes(trimmedInput)) {
                return true;
            }

            return false;
        });
    },

    getLeaderboard: () => {
        return Object.values(db.users)
            .filter(u => u.user_id && u.questions_answered > 0)
            .sort((a, b) => {
                if (b.total_score !== a.total_score) {
                    return b.total_score - a.total_score;
                }
                return a.questions_answered - b.questions_answered;
            })
            .slice(0, 10);
    }
};

module.exports = Quiz;