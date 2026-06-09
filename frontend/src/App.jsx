import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DebateAIPage from './pages/DebateAIPage';
import DebateOnlinePage from './pages/DebateOnlinePage';
import JoinRoomPage from './pages/JoinRoomPage';
import ArenaPage from './pages/ArenaPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/debate-ai" element={<DebateAIPage />} />
        <Route path="/debate-online" element={<DebateOnlinePage />} />
        <Route path="/join/:roomCode" element={<JoinRoomPage />} />
        <Route path="/arena/:debateId" element={<ArenaPage />} />
        <Route path="/result/:debateId" element={<ResultPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
