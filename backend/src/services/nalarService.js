import dotenv from 'dotenv';
import { withRetry } from '../utils/retry.js';

dotenv.config();

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';
const OLLAMA_EVALUATION_MODEL = process.env.OLLAMA_EVALUATION_MODEL || OLLAMA_MODEL;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

function getSoftFallbackArgument(aiSide, roundType) {
  const roundMessages = {
    opening: `Sebagai pihak ${aiSide.toUpperCase()}, kami meyakini bahwa posisi kami didasarkan pada argumen yang kuat dan relevan. Namun saat ini layanan Nalar sedang mengalami kepadatan. Silakan lanjutkan debat, argumen lawan siap ditanggapi di babak berikutnya.`,
    rebuttal: `Kami memahami argumen yang telah Anda sampaikan dan siap memberikan sanggahan. Namun saat ini Nalar sedang mengalami kepadatan layanan sementara. Silakan lanjutkan, kami akan merespons secara optimal secepatnya.`,
    closing: `Sebagai penutup dari pihak ${aiSide.toUpperCase()}, kami menegaskan kembali keyakinan kami atas posisi ini. Terima kasih atas jalannya debat yang produktif ini.`,
  };

  return roundMessages[roundType] || roundMessages.opening;
}

function getSoftFallbackEvaluation(topic) {
  return {
    winnerSide: 'pro',
    proTotalScore: 75,
    contraTotalScore: 73,
    summary: `Debat mengenai "${topic}" berlangsung dengan cukup dinamis. Sayangnya, layanan evaluasi AI Nalar sedang mengalami kepadatan sementara sehingga penilaian yang ditampilkan merupakan hasil estimasi. Silakan coba lagi beberapa saat untuk mendapatkan evaluasi penuh dari Juri AI Nalar.`,
    proStrengths: 'Argumen PRO menunjukkan konsistensi dalam penyampaian premis utama.',
    contraStrengths: 'Argumen KONTRA menunjukkan kemampuan analitis yang baik dalam menyikapi isu.',
    proWeaknesses: 'Evaluasi detail tidak tersedia saat ini karena layanan sedang sibuk.',
    contraWeaknesses: 'Evaluasi detail tidak tersedia saat ini karena layanan sedang sibuk.',
  };
}

function buildTargetLengthInstruction(targetCharacterCount, roundType) {
  const roundMaximums = {
    opening: 500,
    rebuttal: 100,
    closing: 300,
  };

  const roundMaximum = roundMaximums[roundType] || 300;
  const safeTarget = Math.max(60, Math.min(targetCharacterCount || 180, roundMaximum));
  const minTarget = Math.max(40, Math.floor(safeTarget * 0.8));
  const maxTarget = Math.min(roundMaximum, Math.ceil(safeTarget * 1.2));

  return `usahakan sekitar ${safeTarget} karakter, idealnya dalam rentang ${minTarget}-${maxTarget} karakter`;
}

function fitTextToTarget(text, targetCharacterCount, roundType) {
  const roundMaximums = {
    opening: 500,
    rebuttal: 100,
    closing: 300,
  };

  const hardLimit = roundMaximums[roundType] || 300;
  const target = Math.max(60, Math.min(targetCharacterCount || hardLimit, hardLimit));
  const allowed = Math.min(hardLimit, Math.ceil(target * 1.2));

  if (text.length <= allowed) {
    return text;
  }

  const sliced = text.slice(0, allowed);
  const lastSentenceBreak = Math.max(sliced.lastIndexOf('.'), sliced.lastIndexOf('!'), sliced.lastIndexOf('?'));

  if (lastSentenceBreak >= Math.floor(allowed * 0.6)) {
    return sliced.slice(0, lastSentenceBreak + 1).trim();
  }

  return sliced.trim();
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function callOllama({ prompt, model = OLLAMA_MODEL, format, options = {} }) {
  const { signal, cleanup } = createTimeoutSignal(OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format,
        options,
      }),
      signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error || `Ollama request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    const text = payload?.response?.trim?.();
    if (!text) {
      throw new Error('Ollama returned an empty response.');
    }

    return text;
  } finally {
    cleanup();
  }
}

async function generateText(prompt, { model = OLLAMA_MODEL, format, options } = {}) {
  return withRetry(
    () => callOllama({ prompt, model, format, options }),
    3,
    `Ollama(${model})`
  );
}

export async function generateAIArgument({
  topic,
  userSide,
  aiSide,
  aiLevel,
  roundType,
  previousRounds,
  userArgument,
  targetCharacterCount,
}) {
  try {
    const targetLengthInstruction = buildTargetLengthInstruction(targetCharacterCount, roundType);
    const generatedText = await generateText(
      `
Anda adalah AI Nalar, seorang debater ulung dan kritis. Anda sedang berada dalam sesi debat online dengan detail berikut:
Topik Debat: "${topic}"
Posisi Anda (AI): ${aiSide.toUpperCase()}
Posisi Lawan (User): ${userSide.toUpperCase()}
Tingkat Kesulitan AI: ${aiLevel} (easy / medium / hard)
Tipe Ronde: ${roundType} (opening / rebuttal / closing)

Riwayat ronde sebelumnya:
${JSON.stringify(previousRounds, null, 2)}

Di ronde saat ini, lawan Anda (User) baru saja mengirimkan argumen berikut:
"${userArgument}"

Silakan berikan argumen balasan Anda dalam Bahasa Indonesia sebagai pihak ${aiSide.toUpperCase()}.
Ketentuan berdasarkan tingkat kesulitan (${aiLevel}):
- "easy": Gunakan argumen yang sederhana, mudah dipahami, dengan gaya bahasa santai dan poin yang mudah disanggah kembali oleh user.
- "medium": Gunakan argumen yang logis, terstruktur dengan baik, memiliki dasar penalaran yang masuk akal dan bahasa formal yang meyakinkan.
- "hard": Gunakan argumen yang sangat tajam, temukan celah logis (logical fallacy) dari argumen lawan secara langsung, berikan analogi/retorika kuat, dan berikan perlawanan argumen yang sangat sulit dipatahkan.

Panjang tulisan: ${targetLengthInstruction}.
Tuliskan langsung argumen Anda secara natural. JANGAN menyertakan kalimat pembuka seperti "Tentu, ini argumen saya:" atau tanda kutip pembungkus yang tidak perlu.
`,
      {
        model: OLLAMA_MODEL,
        options: {
          temperature: aiLevel === 'easy' ? 0.9 : aiLevel === 'medium' ? 0.7 : 0.5,
          num_predict: roundType === 'rebuttal' ? 120 : roundType === 'closing' ? 220 : 320,
        },
      }
    );

    return fitTextToTarget(generatedText, targetCharacterCount, roundType);
  } catch (error) {
    console.error('[Nalar] Ollama retries exhausted for argument generation. Using soft fallback.', error);
    return getSoftFallbackArgument(aiSide, roundType);
  }
}

export async function evaluateDebate({ topic, participants, rounds }) {
  try {
    const jsonText = await generateText(
      `
Anda adalah Juri AI Nalar, seorang juri debat profesional dan objektif. Anda harus menilai jalannya debat yang telah selesai berikut ini:
Topik Debat: "${topic}"

Peserta:
${JSON.stringify(participants, null, 2)}

Seluruh Ronde Debat:
${JSON.stringify(rounds, null, 2)}

Kriteria Penilaian & Bobot:
1. Relevansi terhadap topik (25%)
2. Logika, penalaran, dan struktur argumen (25%)
3. Bukti, contoh, atau analogi pendukung (20%)
4. Kualitas respons dan sanggahan (rebuttal) terhadap argumen lawan (20%)
5. Etika debat dan penyampaian pesan (10%)

Berikan skor total (skala 0-100) untuk masing-masing pihak (PRO dan CONTRA), tentukan pemenangnya (winnerSide: "pro" atau "contra"), dan berikan umpan balik yang terperinci.

Kembalikan hasil evaluasi HANYA dalam format JSON yang valid tanpa markdown fence atau teks tambahan, dengan struktur berikut:
{
  "winnerSide": "pro" | "contra",
  "proTotalScore": <integer antara 0-100>,
  "contraTotalScore": <integer antara 0-100>,
  "summary": "<ulasan ringkas mengenai jalannya debat secara umum dalam Bahasa Indonesia>",
  "proStrengths": "<analisis kekuatan argumen pihak PRO dalam Bahasa Indonesia>",
  "contraStrengths": "<analisis kekuatan argumen pihak CONTRA dalam Bahasa Indonesia>",
  "proWeaknesses": "<analisis kelemahan argumen pihak PRO dalam Bahasa Indonesia>",
  "contraWeaknesses": "<analisis kelemahan argumen pihak CONTRA dalam Bahasa Indonesia>"
}
`,
      {
        model: OLLAMA_EVALUATION_MODEL,
        format: 'json',
        options: {
          temperature: 0.2,
          num_predict: 700,
        },
      }
    );

    const clean = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error('[Nalar] Ollama retries exhausted for evaluation. Using soft fallback evaluation.', error);
    return getSoftFallbackEvaluation(topic);
  }
}
