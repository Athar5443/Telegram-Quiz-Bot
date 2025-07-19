function validateQuestions(questions) {
    console.log('[VALIDASI] Memvalidasi data soal...');
    const validQuestions = [];
    const uniqueIds = new Set();

    if (!Array.isArray(questions)) {
        console.error('[VALIDASI] ❌ Gagal: `soal.json` bukan sebuah array yang valid.');
        return [];
    }

    questions.forEach((q, index) => {
        const logPrefix = `[VALIDASI] ⚠️ Soal #${index + 1} (nomor: ${q?.nomor ?? 'N/A'})`;

        if (!q?.nomor || !q?.soal || !q?.pilihan || !q?.jawaban_benar || !q?.penjelasan || q?.tingkat_kesulitan === undefined) {
            return console.warn(`${logPrefix} dilewati: field wajib tidak lengkap.`);
        }
        if (uniqueIds.has(q.nomor)) {
            return console.warn(`${logPrefix} dilewati: nomor soal duplikat.`);
        }
        if (typeof q.tingkat_kesulitan !== 'number' || q.tingkat_kesulitan < 1) {
            return console.warn(`${logPrefix} dilewati: tingkat_kesulitan harus angka > 0.`);
        }
        if (typeof q.pilihan !== 'object' || q.pilihan === null || !Object.keys(q.pilihan).length) {
            return console.warn(`${logPrefix} dilewati: 'pilihan' harus berupa objek yang tidak kosong.`);
        }
        if (!q.pilihan[q.jawaban_benar]) {
            return console.warn(`${logPrefix} dilewati: jawaban_benar ("${q.jawaban_benar}") tidak ada di dalam pilihan.`);
        }
        
        uniqueIds.add(q.nomor);
        validQuestions.push(q);
    });
    
    console.log(`[VALIDASI] ✅ ${validQuestions.length} dari ${questions.length} soal lolos validasi.`);
    return validQuestions;
}

module.exports = { validateQuestions };