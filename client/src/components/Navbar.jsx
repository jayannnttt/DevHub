import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, GitCompare, Bookmark, LogIn, LogOut,
  Menu, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('repos');
  const [rateLimit, setRateLimit] = useState(null);
  const [showDotMenu, setShowDotMenu] = useState(false);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowDotMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDotMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchRateLimit = async () => {
      try {
        const res = await api.get('/system/rate-limit');
        setRateLimit(res.data);
      } catch (e) { /* ignore */ }
    };
    fetchRateLimit();
    const interval = setInterval(fetchRateLimit, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
    setSearchQuery('');
  };

  return (
    <nav className="sticky top-0 z-40 bg-devhub-subtle/95 backdrop-blur-sm border-b border-devhub-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-13 py-2">
          
          {/* Left: Top-Left Menu (Instagram style) & Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Instagram-style Top-Left Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowDotMenu(!showDotMenu)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                  showDotMenu
                    ? 'bg-orange-600/15 text-orange-500 border-orange-600/40 shadow-sm shadow-orange-600/15'
                    : 'text-devhub-textPrimary bg-devhub-surface hover:bg-devhub-surfaceHover border-devhub-border hover:border-orange-600/50'
                }`}
                title="Open DevHub Menu"
                aria-label="DevHub Menu"
              >
                <Menu className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold tracking-wide hidden sm:inline text-devhub-textPrimary">
                  Menu
                </span>
              </button>

              {/* Instagram-style Dropdown Menu */}
              {showDotMenu && (
                <div className="absolute left-0 mt-2 w-64 devhub-panel p-2 shadow-2xl bg-devhub-surface/98 backdrop-blur-md border border-devhub-border z-50 animate-fade-in rounded-lg">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-devhub-textMuted border-b border-devhub-borderMuted mb-1 font-semibold flex items-center justify-between">
                    <span>DevHub Navigation</span>
                    <span className="text-[9px] text-orange-500 font-medium">v1.0</span>
                  </div>

                  <Link
                    to="/compare/repos"
                    onClick={() => setShowDotMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-devhub-textPrimary transition-colors"
                  >
                    <GitCompare className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-medium">Compare Repositories</div>
                      <div className="text-[10px] text-devhub-textMuted">Head-to-head repository metrics</div>
                    </div>
                  </Link>

                  <Link
                    to="/compare/developers"
                    onClick={() => setShowDotMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-devhub-textPrimary transition-colors"
                  >
                    <Users className="w-4 h-4 text-devhub-purple" />
                    <div>
                      <div className="font-medium">Compare Developers</div>
                      <div className="text-[10px] text-devhub-textMuted">Benchmarking engineering profiles</div>
                    </div>
                  </Link>

                  <Link
                    to="/search"
                    onClick={() => setShowDotMenu(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-devhub-textPrimary transition-colors"
                  >
                    <Search className="w-4 h-4 text-devhub-cyan" />
                    <div>
                      <div className="font-medium">Search &amp; Filter Directory</div>
                      <div className="text-[10px] text-devhub-textMuted">Explore open-source ecosystem</div>
                    </div>
                  </Link>

                  <div className="border-t border-devhub-borderMuted my-1.5" />

                  {user ? (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowDotMenu(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-devhub-textPrimary transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-medium">My Workspace</div>
                          <div className="text-[10px] text-devhub-textMuted">Saved collections &amp; notes</div>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setShowDotMenu(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out (@{user.username})</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setShowDotMenu(false)}
                      className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 text-xs rounded hover:bg-devhub-surfaceHover text-orange-500 font-medium transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In / Create Account</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Brand Identity */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="DevHub"
                className="w-7 h-7 rounded-md object-cover ring-1 ring-orange-600/40 group-hover:ring-orange-600/70 transition-all"
              />
              <span className="font-display font-bold text-base tracking-tight text-white select-none">
                DevHub
              </span>
            </Link>

            {/* Quick Inset Search for interior pages */}
            {location.pathname !== '/' && (
              <form onSubmit={handleSearch} className="hidden md:flex items-center gap-1.5 ml-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search DevHub..."
                    className="devhub-input pl-8 pr-7 py-1 text-xs w-56 focus:border-orange-600 focus:ring-orange-600/30"
                  />
                  <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-devhub-textMuted px-1 rounded bg-devhub-surface border border-devhub-borderMuted">
                    /
                  </kbd>
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="devhub-select py-1 text-xs"
                >
                  <option value="repos">Repos</option>
                  <option value="users">Devs</option>
                </select>
              </form>
            )}
          </div>

          {/* Right Section: Rate Limit Indicator & Auth */}
          <div className="flex items-center gap-3">
            
            {/* Rate Limit Indicator */}
            {rateLimit && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-devhub-surface border border-devhub-borderMuted text-[11px] font-mono"
                title={`GitHub API Rate Limit: Resets at ${new Date(rateLimit.reset * 1000).toLocaleTimeString()}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    rateLimit.remaining > 15
                      ? 'bg-devhub-action'
                      : rateLimit.remaining > 5
                      ? 'bg-devhub-amber'
                      : 'bg-devhub-red'
                  }`}
                />
                <span className="text-devhub-textMuted">
                  {rateLimit.remaining}/{rateLimit.limit}
                </span>
              </div>
            )}

            {/* Direct Quick Link */}
            <Link
              to="/search"
              className="hidden lg:inline text-xs font-medium text-devhub-textMuted hover:text-devhub-textPrimary transition-colors"
            >
              Directory
            </Link>

            {/* Auth State in Navbar */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="hidden sm:inline text-xs font-mono bg-devhub-surface px-2.5 py-1 rounded border border-devhub-borderMuted text-devhub-textSecondary hover:text-devhub-textPrimary"
                >
                  @{user.username}
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="devhub-btn-subtle p-1 text-devhub-textMuted hover:text-red-400"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="devhub-btn-orange">
                <LogIn className="w-3 h-3" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
