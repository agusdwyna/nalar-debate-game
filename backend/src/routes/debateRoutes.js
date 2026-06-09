import { Router } from 'express';
import {
  createAIDebate,
  createOnlineDebate,
  getDebateById,
  getDebateByRoomCode,
  joinOnlineDebate,
  submitRoundArgument,
  finalizeDebate,
} from '../controllers/debateController.js';

const router = Router();

// Endpoint untuk debat lawan AI
router.post('/ai', createAIDebate);

// Endpoint untuk debat online lawan teman
router.post('/online', createOnlineDebate);

// Mengambil detail debat berdasarkan ID
router.get('/:id', getDebateById);

// Mengambil detail debat berdasarkan room code
router.get('/room/:roomCode', getDebateByRoomCode);

// Join room debat online
router.post('/:roomCode/join', joinOnlineDebate);

// Submit argumen ronde debat
router.post('/:id/rounds/:roundNumber/submit', submitRoundArgument);

// Finalisasi dan penilaian debat
router.post('/:id/finalize', finalizeDebate);

export default router;
