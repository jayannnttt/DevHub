import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import UserProfile from './pages/UserProfile';
import RepoDetails from './pages/RepoDetails';
import RepoCompare from './pages/RepoCompare';
import DevCompare from './pages/DevCompare';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-devhub-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-devhub-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-devhub-textMuted text-xs font-mono">INITIALIZING DEVHUB TELEMETRY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-devhub-bg text-devhub-textSecondary flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/repo/:owner/:repo" element={<RepoDetails />} />
          <Route path="/compare/repos" element={<RepoCompare />} />
          <Route path="/compare/developers" element={<DevCompare />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <footer className="border-t border-devhub-borderMuted py-4 bg-devhub-subtle text-devhub-textMuted text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-devhub-textPrimary">DevHub</span>
            <span>&mdash; Developer &amp; Repository Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>DATA SOURCE: GITHUB REST API V3</span>
            <span>PERSISTENCE: SQLITE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
