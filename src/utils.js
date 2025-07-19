/**
 * Fungsi untuk meloloskan (escape) karakter spesial untuk parser MarkdownV2 Telegram.
 * @param {string} text Teks yang akan di-escape.
 * @returns {string} Teks yang aman untuk dikirim.
 */
function escapeMarkdownV2(text) {
    if (typeof text !== 'string') {
        text = String(text);
    }
    const charsToEscape = /[_*[\]()~`>#+\-=|{}.!]/g;
    return text.replace(charsToEscape, '\\$&');
}

module.exports = { escapeMarkdownV2 };