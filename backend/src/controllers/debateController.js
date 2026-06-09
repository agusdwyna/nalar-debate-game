import prisma from '../utils/prisma.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { generateSessionId } from '../utils/session.js';
import { generateQRCode } from '../services/qrService.js';
import { generateAIArgument, evaluateDebate } from '../services/nalarService.js';

const FRONTEND_APP_URL = process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || '';
const ONLINE_READY_COUNTDOWN_MS = 5000;

const ROUND_RULES = {
  opening: {
    durationMs: 90 * 1000,
    maxChars: 500,
    timeoutText: 'Waktu habis. Argumen opening tidak dikirim.',
  },
  rebuttal: {
    durationMs: 2 * 60 * 1000,
    maxChars: 100,
    timeoutText: 'Waktu habis. Argumen rebuttal tidak dikirim.',
  },
  closing: {
    durationMs: 60 * 1000,
    maxChars: 300,
    timeoutText: 'Waktu habis. Argumen closing tidak dikirim.',
  },
};

function getRoundRule(roundType) {
  return ROUND_RULES[roundType] || ROUND_RULES.opening;
}

function createRoundSeeds() {
  return [
    { roundNumber: 1, roundType: 'opening' },
    { roundNumber: 2, roundType: 'rebuttal' },
    { roundNumber: 3, roundType: 'closing' },
  ];
}

function getDeadlineIso(debate, round) {
  if (!round) return null;
  const startedAt = new Date(debate.updatedAt).getTime();
  const deadline = startedAt + getRoundRule(round.roundType).durationMs;
  return new Date(deadline).toISOString();
}

function getReadyCountdownDeadlineIso(debate) {
  if (!debate?.readyCountdownStartedAt) return null;
  return new Date(new Date(debate.readyCountdownStartedAt).getTime() + ONLINE_READY_COUNTDOWN_MS).toISOString();
}

function decorateDebate(debate) {
  const currentRound = debate.rounds.find((round) => round.roundNumber === debate.currentRound);

  return {
    ...debate,
    participants: debate.participants.map(({ sessionId, ...participant }) => participant),
    roundRules: ROUND_RULES,
    currentRoundDeadline: getDeadlineIso(debate, currentRound),
    readyCountdownDeadline: getReadyCountdownDeadlineIso(debate),
  };
}

function sanitizeDebateForParticipant(debate, sessionId) {
  if (!sessionId || debate.mode !== 'ONLINE') {
    return debate;
  }

  const participant = debate.participants.find((item) => item.sessionId === sessionId);
  if (!participant) {
    return debate;
  }

  const rounds = debate.rounds.map((round) => {
    const isCurrentRound = round.roundNumber === debate.currentRound;
    const isIncomplete = !round.proArgument || !round.contraArgument;

    if (!isCurrentRound || !isIncomplete) {
      return round;
    }

    if (participant.side === 'pro') {
      return { ...round, contraArgument: null };
    }

    return { ...round, proArgument: null };
  });

  return {
    ...debate,
    rounds,
  };
}

async function fetchDebateOrThrow(id) {
  const debate = await prisma.debate.findUnique({
    where: { id },
    include: {
      participants: true,
      rounds: {
        orderBy: {
          roundNumber: 'asc',
        },
      },
      result: true,
    },
  });

  return debate;
}

async function syncDebateState(debate) {
  let currentDebate = debate;

  if (currentDebate?.mode === 'ONLINE') {
    currentDebate = await syncOnlineLobbyState(currentDebate);
  }

  while (currentDebate && currentDebate.status === 'ongoing') {
    const activeRound = currentDebate.rounds.find((round) => round.roundNumber === currentDebate.currentRound);
    if (!activeRound) break;

    const isRoundComplete = Boolean(activeRound.proArgument && activeRound.contraArgument);
    if (isRoundComplete) break;

    const deadline = new Date(currentDebate.updatedAt).getTime() + getRoundRule(activeRound.roundType).durationMs;
    if (Date.now() < deadline) break;

    currentDebate = await finalizeExpiredRound(currentDebate, activeRound);

    if (activeRound.roundNumber === currentDebate.currentRound) {
      break;
    }
  }

  return currentDebate;
}

async function syncOnlineLobbyState(debate) {
  if (!debate || debate.mode !== 'ONLINE' || debate.status === 'finished') {
    return debate;
  }

  const humanParticipants = debate.participants.filter((participant) => !participant.isAI);
  const hasBothPlayers = humanParticipants.length === 2;
  const everyoneReady = hasBothPlayers && humanParticipants.every((participant) => participant.isReady);

  if (debate.status === 'countdown') {
    if (!everyoneReady) {
      await prisma.debate.update({
        where: { id: debate.id },
        data: {
          status: 'waiting',
          readyCountdownStartedAt: null,
        },
      });

      return fetchDebateOrThrow(debate.id);
    }

    const countdownDeadline = new Date(debate.readyCountdownStartedAt).getTime() + ONLINE_READY_COUNTDOWN_MS;
    if (Date.now() >= countdownDeadline) {
      await prisma.debate.update({
        where: { id: debate.id },
        data: {
          status: 'ongoing',
          readyCountdownStartedAt: null,
        },
      });

      return fetchDebateOrThrow(debate.id);
    }
  }

  if (debate.status === 'waiting' && everyoneReady) {
    await prisma.debate.update({
      where: { id: debate.id },
      data: {
        status: 'countdown',
        readyCountdownStartedAt: new Date(),
      },
    });

    return fetchDebateOrThrow(debate.id);
  }

  return debate;
}

async function finalizeExpiredRound(debate, round) {
  const updateData = {};

  if (!round.proArgument) {
    updateData.proArgument = getRoundRule(round.roundType).timeoutText;
  }

  if (!round.contraArgument) {
    updateData.contraArgument = getRoundRule(round.roundType).timeoutText;
  }

  if (debate.mode === 'AI') {
    const userParticipant = debate.participants.find((participant) => !participant.isAI);
    const aiParticipant = debate.participants.find((participant) => participant.isAI);
    const missingUserArgument = !round.proArgument || !round.contraArgument;

    if (userParticipant && aiParticipant) {
      const userSide = userParticipant.side;
      const aiSide = aiParticipant.side;
      const userArgument = userSide === 'pro'
        ? (round.proArgument || updateData.proArgument || '')
        : (round.contraArgument || updateData.contraArgument || '');

      if ((aiSide === 'pro' && !round.proArgument) || (aiSide === 'contra' && !round.contraArgument)) {
        const previousRounds = debate.rounds
          .filter((item) => item.roundNumber < round.roundNumber)
          .map((item) => ({
            roundNumber: item.roundNumber,
            roundType: item.roundType,
            proArgument: item.proArgument,
            contraArgument: item.contraArgument,
          }));

        const aiArgument = await generateAIArgument({
          topic: debate.topic,
          userSide,
          aiSide,
          aiLevel: debate.aiLevel,
          roundType: round.roundType,
          previousRounds,
          userArgument,
          targetCharacterCount: Math.max(80, userArgument.length),
        });

        if (aiSide === 'pro') {
          updateData.proArgument = aiArgument;
        } else {
          updateData.contraArgument = aiArgument;
        }
      } else if (missingUserArgument && aiSide === 'pro' && !updateData.proArgument) {
        updateData.proArgument = round.proArgument;
      } else if (missingUserArgument && aiSide === 'contra' && !updateData.contraArgument) {
        updateData.contraArgument = round.contraArgument;
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.debateRound.update({
      where: { id: round.id },
      data: updateData,
    });
  }

  if (round.roundNumber < debate.totalRounds) {
    await prisma.debate.update({
      where: { id: debate.id },
      data: { currentRound: round.roundNumber + 1 },
    });
  }

  return fetchDebateOrThrow(debate.id);
}

function validateArgumentByRound(argument, roundType) {
  const trimmed = argument?.trim?.() || '';
  const { maxChars } = getRoundRule(roundType);

  if (!trimmed) {
    return 'Argumen wajib diisi.';
  }

  if (trimmed.length > maxChars) {
    return `Argumen melebihi batas ${maxChars} karakter untuk ronde ${roundType}.`;
  }

  return null;
}

export const createAIDebate = async (req, res) => {
  try {
    const { username, topic, side, aiLevel } = req.body;
    if (!username || !topic || !side || !aiLevel) {
      return res.status(400).json({ error: 'Username, topic, side, dan aiLevel wajib diisi.' });
    }

    const roomCode = generateRoomCode();
    const sessionId = generateSessionId();

    const debate = await prisma.debate.create({
      data: {
        roomCode,
        mode: 'AI',
        topic,
        status: 'ongoing',
        aiLevel,
        participants: {
          create: [
            {
              username,
              side,
              sessionId,
              isAI: false,
            },
            {
              username: 'AI Nalar',
              side: side === 'pro' ? 'contra' : 'pro',
              sessionId: 'ai-session-id',
              isAI: true,
            },
          ],
        },
        rounds: {
          create: createRoundSeeds(),
        },
      },
      include: {
        participants: true,
        rounds: true,
      },
    });

    return res.status(201).json({
      debateId: debate.id,
      roomCode: debate.roomCode,
      sessionId,
      debate: decorateDebate(debate),
    });
  } catch (error) {
    console.error('Error creating AI debate:', error);
    return res.status(500).json({ error: 'Gagal membuat debat AI: ' + error.message });
  }
};

export const createOnlineDebate = async (req, res) => {
  try {
    const { username, topic, side } = req.body;
    if (!username || !topic || !side) {
      return res.status(400).json({ error: 'Username, topic, dan side wajib diisi.' });
    }

    const roomCode = generateRoomCode();
    const sessionId = generateSessionId();
    const inviteLink = FRONTEND_APP_URL
      ? `${FRONTEND_APP_URL.replace(/\/+$/, '')}/join/${roomCode}`
      : `/join/${roomCode}`;
    const qrCode = await generateQRCode(inviteLink);

    const debate = await prisma.debate.create({
      data: {
        roomCode,
        mode: 'ONLINE',
        topic,
        status: 'waiting',
        participants: {
          create: [
            {
              username,
              side,
              sessionId,
              isAI: false,
            },
          ],
        },
        rounds: {
          create: createRoundSeeds(),
        },
      },
      include: {
        participants: true,
        rounds: true,
      },
    });

    return res.status(201).json({
      debateId: debate.id,
      roomCode: debate.roomCode,
      inviteLink,
      qrCode,
      sessionId,
      debate: decorateDebate(debate),
    });
  } catch (error) {
    console.error('Error creating Online debate:', error);
    return res.status(500).json({ error: 'Gagal membuat debat online: ' + error.message });
  }
};

export const getDebateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;

    let debate = await fetchDebateOrThrow(id);

    if (!debate) {
      return res.status(404).json({ error: 'Debat tidak ditemukan.' });
    }

    debate = await syncDebateState(debate);
    debate = sanitizeDebateForParticipant(debate, sessionId);

    return res.json(decorateDebate(debate));
  } catch (error) {
    console.error('Error fetching debate:', error);
    return res.status(500).json({ error: 'Gagal mengambil data debat.' });
  }
};

export const getDebateByRoomCode = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const debate = await prisma.debate.findUnique({
      where: { roomCode },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            side: true,
            isAI: true,
            isReady: true,
          },
        },
      },
    });

    if (!debate) {
      return res.status(404).json({ error: 'Room tidak ditemukan.' });
    }

    return res.json(debate);
  } catch (error) {
    console.error('Error fetching debate by room code:', error);
    return res.status(500).json({ error: 'Gagal mengambil data room.' });
  }
};

export const joinOnlineDebate = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username wajib diisi.' });
    }

    const debate = await prisma.debate.findUnique({
      where: { roomCode },
      include: { participants: true },
    });

    if (!debate) {
      return res.status(404).json({ error: 'Room tidak ditemukan.' });
    }

    if (debate.mode !== 'ONLINE') {
      return res.status(400).json({ error: 'Room ini bukan untuk mode online.' });
    }

    if (debate.participants.length >= 2) {
      return res.status(400).json({ error: 'Room debat sudah penuh.' });
    }

    const host = debate.participants[0];
    const joinerSide = host.side === 'pro' ? 'contra' : 'pro';
    const sessionId = generateSessionId();

    await prisma.participant.create({
      data: {
        debateId: debate.id,
        username,
        side: joinerSide,
        sessionId,
        isAI: false,
        isReady: false,
      },
    });

    return res.json({
      debateId: debate.id,
      sessionId,
      side: joinerSide,
    });
  } catch (error) {
    console.error('Error joining debate:', error);
    return res.status(500).json({ error: 'Gagal masuk ke room debat.' });
  }
};

export const setOnlineParticipantReady = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, ready } = req.body;

    if (!sessionId || typeof ready !== 'boolean') {
      return res.status(400).json({ error: 'Session ID dan status ready wajib diisi.' });
    }

    let debate = await fetchDebateOrThrow(id);
    if (!debate) {
      return res.status(404).json({ error: 'Debat tidak ditemukan.' });
    }

    if (debate.mode !== 'ONLINE') {
      return res.status(400).json({ error: 'Mode ready hanya berlaku untuk debat online.' });
    }

    if (debate.status === 'finished') {
      return res.status(400).json({ error: 'Debat ini sudah selesai.' });
    }

    const participant = debate.participants.find((item) => item.sessionId === sessionId && !item.isAI);
    if (!participant) {
      return res.status(403).json({ error: 'Akses ditolak. Sesi tidak valid.' });
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { isReady: ready },
    });

    debate = await fetchDebateOrThrow(id);
    debate = await syncOnlineLobbyState(debate);
    debate = sanitizeDebateForParticipant(debate, sessionId);

    return res.json({
      debate: decorateDebate(debate),
    });
  } catch (error) {
    console.error('Error updating ready state:', error);
    return res.status(500).json({ error: 'Gagal memperbarui status ready.' });
  }
};

export const submitRoundArgument = async (req, res) => {
  try {
    const { id, roundNumber } = req.params;
    const { sessionId, argument } = req.body;
    const requestedRoundNumber = parseInt(roundNumber, 10);

    if (!sessionId || !argument) {
      return res.status(400).json({ error: 'Session ID dan argument wajib diisi.' });
    }

    let debate = await fetchDebateOrThrow(id);
    if (!debate) {
      return res.status(404).json({ error: 'Debat tidak ditemukan.' });
    }

    debate = await syncDebateState(debate);

    const participant = debate.participants.find((item) => item.sessionId === sessionId);
    if (!participant) {
      return res.status(403).json({ error: 'Akses ditolak. Sesi tidak valid.' });
    }

    if (debate.mode === 'ONLINE' && debate.status !== 'ongoing') {
      return res.status(400).json({ error: 'Debat belum dimulai. Tunggu sampai kedua pemain ready.' });
    }

    if (requestedRoundNumber !== debate.currentRound) {
      return res.status(400).json({ error: 'Ronde ini sudah berakhir atau belum aktif.' });
    }

    const round = debate.rounds.find((item) => item.roundNumber === requestedRoundNumber);
    if (!round) {
      return res.status(404).json({ error: 'Ronde tidak ditemukan.' });
    }

    const validationError = validateArgumentByRound(argument, round.roundType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const side = participant.side;
    if (side === 'pro' && round.proArgument) {
      return res.status(400).json({ error: 'Anda sudah mengirimkan argumen untuk ronde ini.' });
    }
    if (side === 'contra' && round.contraArgument) {
      return res.status(400).json({ error: 'Anda sudah mengirimkan argumen untuk ronde ini.' });
    }

    const updateData = side === 'pro'
      ? { proArgument: argument.trim() }
      : { contraArgument: argument.trim() };

    await prisma.debateRound.update({
      where: { id: round.id },
      data: updateData,
    });

    if (debate.mode === 'AI') {
      const aiSide = side === 'pro' ? 'contra' : 'pro';
      const previousRounds = debate.rounds
        .filter((item) => item.roundNumber < requestedRoundNumber)
        .map((item) => ({
          roundNumber: item.roundNumber,
          roundType: item.roundType,
          proArgument: item.proArgument,
          contraArgument: item.contraArgument,
        }));

      const aiArgument = await generateAIArgument({
        topic: debate.topic,
        userSide: side,
        aiSide,
        aiLevel: debate.aiLevel,
        roundType: round.roundType,
        previousRounds,
        userArgument: argument.trim(),
        targetCharacterCount: argument.trim().length,
      });

      await prisma.debateRound.update({
        where: { id: round.id },
        data: aiSide === 'pro' ? { proArgument: aiArgument } : { contraArgument: aiArgument },
      });

      if (requestedRoundNumber < debate.totalRounds) {
        await prisma.debate.update({
          where: { id: debate.id },
          data: { currentRound: requestedRoundNumber + 1 },
        });
      }
    } else {
      const updatedRound = await prisma.debateRound.findUnique({
        where: { id: round.id },
      });

      const isRoundFinished = Boolean(updatedRound?.proArgument && updatedRound?.contraArgument);
      if (isRoundFinished && requestedRoundNumber < debate.totalRounds) {
        await prisma.debate.update({
          where: { id: debate.id },
          data: { currentRound: requestedRoundNumber + 1 },
        });
      }
    }

    let updatedDebate = await fetchDebateOrThrow(debate.id);
    updatedDebate = sanitizeDebateForParticipant(updatedDebate, sessionId);

    return res.json({
      debate: decorateDebate(updatedDebate),
    });
  } catch (error) {
    console.error('Error submitting round argument:', error);
    return res.status(500).json({ error: 'Gagal mengirimkan argumen.' });
  }
};

export const finalizeDebate = async (req, res) => {
  try {
    const { id } = req.params;

    let debate = await fetchDebateOrThrow(id);
    if (!debate) {
      return res.status(404).json({ error: 'Debat tidak ditemukan.' });
    }

    debate = await syncDebateState(debate);

    if (debate.result) {
      return res.json({
        status: 'finished',
        result: debate.result,
      });
    }

    const isAllRoundsSubmitted = debate.rounds.every((round) => round.proArgument && round.contraArgument);
    if (!isAllRoundsSubmitted) {
      return res.status(400).json({ error: 'Semua ronde harus diselesaikan sebelum debat dinilai.' });
    }

    const evaluation = await evaluateDebate({
      topic: debate.topic,
      participants: debate.participants,
      rounds: debate.rounds,
    });

    const debateResult = await prisma.debateResult.create({
      data: {
        debateId: id,
        winnerSide: evaluation.winnerSide,
        proTotalScore: evaluation.proTotalScore,
        contraTotalScore: evaluation.contraTotalScore,
        summary: evaluation.summary,
        proStrengths: evaluation.proStrengths,
        contraStrengths: evaluation.contraStrengths,
        proWeaknesses: evaluation.proWeaknesses,
        contraWeaknesses: evaluation.contraWeaknesses,
      },
    });

    await prisma.debate.update({
      where: { id },
      data: { status: 'finished' },
    });

    return res.json({
      status: 'finished',
      result: debateResult,
    });
  } catch (error) {
    console.error('Error finalizing debate:', error);
    return res.status(500).json({ error: 'Gagal menilai debat.' });
  }
};
