const fs = require('fs');
const config = require('./config');
const { validateQuestions } = require('./validator');

const db = {
    users: {},
    questions: [],
    answers: [],
    usersByTgId: {},
    maxDifficulty: 1,
};

let isDbDirty = false;

function read(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) { console.error(`❌ Gagal membaca ${filePath}:`, error.message); }
    return defaultValue;
}

function write(filePath, data) {
    try {
        const tempFile = `${filePath}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, filePath);
    } catch (error) { console.error(`❌ Gagal menulis ke ${filePath}:`, error.message); }
}

function loadAllDatabases() {
    db.users = read(config.DB_FILES.USERS, {});
    db.answers = read(config.DB_FILES.ANSWERS, []);
    db.questions = validateQuestions(read(config.DB_FILES.QUESTIONS, []));
    
    db.maxDifficulty = Math.max(...db.questions.map(q => q.tingkat_kesulitan ?? 1), 1);

    for (const profileId in db.users) {
        const user = db.users[profileId];
        user.total_score = user.total_score ?? 0;
        user.questions_answered = user.questions_answered ?? 0;
        user.rounds_completed = user.rounds_completed ?? 0;
        
        user.current_round_score = user.current_round_score ?? 0;
        user.current_round_answered = user.current_round_answered ?? 0;

        user.answeredQuestions = user.answeredQuestions ?? [];
        user.question_counter = user.question_counter ?? 0;
        user.rating = user.rating ?? config.QUIZ_SETTINGS.STARTING_RATING;
        user.is_active = user.is_active !== false;

        if (user.user_id) {
            db.usersByTgId[user.user_id] = user;
        }
    }
    console.log(`[DB] ✅ ${Object.keys(db.users).length} pengguna, ${db.questions.length} soal dimuat.`);
}

const markAsDirty = () => { isDbDirty = true; };

function scheduleDbSave() {
    if (isDbDirty) {
        console.log('💾 Perubahan terdeteksi, menyimpan database ke disk...');
        write(config.DB_FILES.USERS, db.users);
        write(config.DB_FILES.ANSWERS, db.answers);
        isDbDirty = false;
    }
}

module.exports = { db, loadAllDatabases, markAsDirty, scheduleDbSave };