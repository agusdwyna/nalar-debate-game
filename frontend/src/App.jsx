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
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Debate AI Setup */}
        <Route path="/debate-ai" element={<DebateAIPage />} />
        
        {/* Debate Online Host Setup */}
        <Route path="/debate-online" element={<DebateOnlinePage />} />
        
        {/* Join Debate Online Room */}
        <Route path="/join/:roomCode" element={<JoinRoomPage />} />
        
        {/* Debate Arena */}
        <Route path="/arena/:debateId" element={<ArenaPage />} />
        
        {/* Final Evaluation Result */}
        <Route path="/result/:debateId" element={<ResultPage />} />
        
        {/* Fallback redirect */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}
