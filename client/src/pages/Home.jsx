import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, GitCompare, Star, GitFork, Users, Code2, ArrowRight,
  Terminal, Sparkles, X, LogIn, UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatNumber, getLanguageColor } from '../utils/languages';
import api from '../utils/api';

// Reliable default dataset for instant zero-latency render
const FALLBACK_TOP_REPOS = [
  {
    full_name: 'freeCodeCamp/freeCodeCamp',
    name: 'freeCodeCamp',
    owner: { login: 'freeCodeCamp', avatar_url: 'https://avatars.githubusercontent.com/u/9892522?v=4' },
    description: 'freeCodeCamp.org\'s open-source codebase and curriculum. Learn to code for free.',
    stargazers_count: 398000,
    forks_count: 37200,
    language: 'TypeScript',
  },
  {
    full_name: 'sindresorhus/awesome',
    name: 'awesome',
    owner: { login: 'sindresorhus', avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4' },
    description: 'Awesome lists about all kinds of interesting topics, frameworks, and tools.',
    stargazers_count: 325000,
    forks_count: 27800,
    language: 'Markdown',
  },
  {
    full_name: 'public-apis/public-apis',
    name: 'public-apis',
    owner: { login: 'public-apis', avatar_url: 'https://avatars.githubusercontent.com/u/51121568?v=4' },
    description: 'A collective list of free APIs for use in software and web development.',
    stargazers_count: 312000,
    forks_count: 33400,
    language: 'Python',
  },
  {
    full_name: 'facebook/react',
    name: 'react',
    owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4' },
    description: 'The library for web and native user interfaces.',
    stargazers_count: 228000,
    forks_count: 46200,
    language: 'JavaScript',
  },
  {
    full_name: 'vuejs/core',
    name: 'core',
    owner: { login: 'vuejs', avatar_url: 'https://avatars.githubusercontent.com/u/6128107?v=4' },
    description: 'Vue.js is a progressive, incrementally-adoptable JavaScript framework for building UI on the web.',
    stargazers_count: 46800,
    forks_count: 8100,
    language: 'TypeScript',
  },
];

const FALLBACK_TOP_DEVS = [
  {
    login: 'torvalds',
    name: 'Linus Torvalds',
    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    bio: 'Creator of Linux and Git',
    followers: 215000,
    public_repos: 7,
  },
  {
    login: 'karpathy',
    name: 'Andrej Karpathy',
    avatar_url: 'https://avatars.githubusercontent.com/u/241138?v=4',
    bio: 'I like to train Deep Neural Nets on large datasets.',
    followers: 104000,
    public_repos: 54,
  },
  {
    login: 'gaearon',
    name: 'Dan Abramov',
    avatar_url: 'https://avatars.githubusercontent.com/u/810438?v=4',
    bio: 'Working on React and developer tools',
    followers: 87200,
    public_repos: 260,
  },
  {
    login: 'antfu',
    name: 'Anthony Fu',
    avatar_url: 'https://avatars.githubusercontent.com/u/11247099?v=4',
    bio: 'A core team member of Vite and Vue.',
    followers: 65400,
    public_repos: 420,
  },
  {
    login: 'yyx990803',
    name: 'Evan You',
    avatar_url: 'https://avatars.githubusercontent.com/u/499550?v=4',
    bio: 'Creator of Vue.js and Vite',
    followers: 99800,
    public_repos: 82,
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('repos');
  const [topRepos, setTopRepos] = useState(FALLBACK_TOP_REPOS);
  const [topDevs, setTopDevs] = useState(FALLBACK_TOP_DEVS);

  // Welcome Gate State: Shows on first visit for unauthenticated visitors
  const [showWelcome, setShowWelcome] = useState(() => {
    return !user && sessionStorage.getItem('devhub_welcomed') !== 'true';
  });

  // Fetch live top repositories & developers
  useEffect(() => {
    let isMounted = true;
    const fetchTopData = async () => {
      try {
        const [reposRes, devsRes] = await Promise.allSettled([
          api.get('/repos/search', { params: { q: 'stars:>80000', sort: 'stars', page: 1 } }),
          api.get('/users/search', { params: { q: 'followers:>25000', sort: 'followers', page: 1 } }),
        ]);

        if (isMounted) {
          if (reposRes.status === 'fulfilled' && reposRes.value.data.items?.length > 0) {
            setTopRepos(reposRes.value.data.items.slice(0, 5));
          }
          if (devsRes.status === 'fulfilled' && devsRes.value.data.items?.length > 0) {
            setTopDevs(devsRes.value.data.items.slice(0, 5));
          }
        }
      } catch (e) {
        // Fallbacks remain in place gracefully
      }
    };
    fetchTopData();
    return () => { isMounted = false; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}&type=${searchType}`);
  };

  const handleSkipWelcome = () => {
    sessionStorage.setItem('devhub_welcomed', 'true');
    setShowWelcome(false);
  };

  const quickChips = [
    { label: 'React', q: 'react', type: 'repos' },
    { label: 'Next.js', q: 'nextjs', type: 'repos' },
    { label: 'Rust', q: 'rust', type: 'repos' },
    { label: 'Python', q: 'python', type: 'repos' },
    { label: 'Linus Torvalds', q: 'torvalds', type: 'users' },
    { label: 'Anthony Fu', q: 'antfu', type: 'users' },
  ];

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col justify-start">
      
      {/* 1. WELCOME MODAL OVERLAY (With Login/Signup & Skip Button) */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="devhub-panel w-full max-w-md p-6 bg-devhub-surface border border-devhub-border shadow-2xl relative">
            
            {/* Close / Skip button in top corner */}
            <button
              onClick={handleSkipWelcome}
              className="absolute top-4 right-4 text-devhub-textMuted hover:text-devhub-textPrimary text-xs flex items-center gap-1 font-mono"
            >
              Skip <X className="w-3.5 h-3.5" />
            </button>

            <div className="text-center py-2">
                <img
                  src="/devhub-lockup-transparent.png"
                  alt="DevHub"
                  className="h-12 w-auto mx-auto mb-3 object-contain"
                />
                <h2 className="text-lg font-bold text-devhub-textPrimary tracking-tight">
                  Welcome to DevHub
                </h2>
                <p className="text-xs text-devhub-textSecondary mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                  Search, inspect, and benchmark open-source GitHub repositories and developers in real-time.
                </p>

                <div className="space-y-2.5">
                  <Link
                    to="/login"
                    className="devhub-btn-orange w-full py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Sign In to Your Account
                  </Link>
                  <Link
                    to="/register"
                    className="devhub-btn-default w-full py-2 text-xs flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create New Account
                  </Link>
                  <button
                    onClick={handleSkipWelcome}
                    className="w-full py-2 text-xs text-devhub-textMuted hover:text-devhub-textPrimary font-mono transition-colors"
                  >
                    Continue as Guest &rarr;
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* 2. GOOGLE-STYLE CENTERED DEVHUB SEARCH EXPERIENCE */}
      <div className="max-w-4xl mx-auto px-4 pt-12 sm:pt-16 pb-10 w-full text-center">
        
        {/* Exact DevHub Brand Lockup directly above search bar */}
        <div className="mb-8 flex items-center justify-center">
          <img
            src="/devhub-lockup-transparent.png"
            alt="DevHub"
            className="h-16 sm:h-20 md:h-24 w-auto max-w-[90vw] object-contain select-none hover:scale-[1.02] transition-transform duration-200"
          />
        </div>

        {/* Centered Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="relative flex items-center shadow-lg rounded-md border border-devhub-border bg-devhub-surface hover:border-devhub-borderFocus focus-within:border-orange-600 focus-within:ring-2 focus-within:ring-orange-600/30 transition-all">
            <Search className="w-4 h-4 text-orange-500 ml-3.5 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchType === 'repos'
                  ? 'Search repositories (e.g. react, next.js, rust)...'
                  : 'Search developers (e.g. torvalds, gaearon, antfu)...'
              }
              className="w-full bg-transparent px-3 py-3 text-sm text-devhub-textPrimary placeholder-devhub-textMuted focus:outline-none"
            />
            <div className="flex items-center gap-1.5 pr-2 flex-shrink-0">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="devhub-select py-1.5 px-2.5 text-xs bg-devhub-subtle"
              >
                <option value="repos">Repos</option>
                <option value="users">Devs</option>
              </select>
              <button
                type="submit"
                className="devhub-btn-orange py-1.5 px-4 text-xs font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          {/* Clean Quick Query Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs">
            <span className="text-[11px] font-mono text-devhub-textMuted mr-1">Trending:</span>
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setSearchType(chip.type);
                  navigate(`/search?q=${encodeURIComponent(chip.q)}&type=${chip.type}`);
                }}
                className="devhub-btn-subtle py-0.5 px-2 text-[11px] border border-devhub-borderMuted rounded-full"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* 3. TOP REPOSITORIES THIS WEEK & TOP DEVELOPERS LIST */}
      <div className="max-w-6xl mx-auto px-4 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Top Repositories This Week */}
          <div className="devhub-panel">
            <div className="devhub-panel-header">
              <span className="flex items-center gap-1.5 text-devhub-brand">
                <Code2 className="w-3.5 h-3.5" /> Top Repositories This Week
              </span>
              <Link to="/search?type=repos&sort=stars" className="devhub-btn-subtle text-[11px]">
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-devhub-borderMuted">
              {topRepos.map((repo, idx) => {
                const ownerLogin = repo.owner?.login || repo.full_name.split('/')[0];
                const repoName = repo.name || repo.full_name.split('/')[1];
                return (
                  <div key={repo.full_name || idx} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/repo/${ownerLogin}/${repoName}`}
                          className="text-xs font-semibold text-devhub-brand hover:underline truncate"
                        >
                          {ownerLogin} / {repoName}
                        </Link>
                        {repo.language && (
                          <span className="flex items-center gap-1 text-[11px] text-devhub-textMuted font-mono">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-1">
                        {repo.description || 'Open-source repository'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-devhub-textMuted font-mono">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-devhub-amber" /> {formatNumber(repo.stargazers_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" /> {formatNumber(repo.forks_count)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        to={`/repo/${ownerLogin}/${repoName}`}
                        className="devhub-btn-default py-1 px-2 text-[11px]"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Developers List */}
          <div className="devhub-panel">
            <div className="devhub-panel-header">
              <span className="flex items-center gap-1.5 text-devhub-purple">
                <Users className="w-3.5 h-3.5" /> Featured Developers
              </span>
              <Link to="/search?type=users&sort=followers" className="devhub-btn-subtle text-[11px]">
                View All &rarr;
              </Link>
            </div>

            <div className="divide-y divide-devhub-borderMuted">
              {topDevs.map((dev, idx) => (
                <div key={dev.login || idx} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={dev.avatar_url}
                      alt=""
                      className="w-9 h-9 rounded-full border border-devhub-border flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/user/${dev.login}`}
                          className="text-xs font-semibold text-devhub-brand hover:underline"
                        >
                          @{dev.login}
                        </Link>
                        {dev.name && (
                          <span className="text-[11px] text-devhub-textMuted truncate">({dev.name})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-devhub-textSecondary mt-0.5 line-clamp-1">
                        {dev.bio || 'GitHub open-source contributor'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-devhub-textMuted">
                        <span>{formatNumber(dev.followers)} followers</span>
                        {dev.public_repos > 0 && <span>{dev.public_repos} repos</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link
                      to={`/user/${dev.login}`}
                      className="devhub-btn-default py-1 px-2.5 text-[11px]"
                    >
                      Dossier
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}