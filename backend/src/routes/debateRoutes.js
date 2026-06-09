import { Router } from 'express';
import {
  createAIDebate,
  createOnlineDebate,
  getDebateById,
  getDebateByRoomCode,
  joinOnlineDebate,
  setOnlineParticipantReady,
  submitRoundArgument,
  finalizeDebate,
} from '../controllers/debateController.js';

const router = Router();

router.post('/ai', createAIDebate);
router.post('/online', createOnlineDebate);
router.get('/:id', getDebateById);
router.get('/room/:roomCode', getDebateByRoomCode);
router.post('/:roomCode/join', joinOnlineDebate);
router.post('/:id/ready', setOnlineParticipantReady);
router.post('/:id/rounds/:roundNumber/submit', submitRoundArgument);
router.post('/:id/finalize', finalizeDebate);

export default router;
