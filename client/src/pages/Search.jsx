import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Star, GitFork, ExternalLink, ChevronLeft, ChevronRight, Filter, Terminal, User } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { formatNumber, getLanguageColor, timeAgo } from '../utils/languages';
import api from '../utils/api';

function SkeletonRow() {
  return (
    <div className="p-3 border-b border-devhub-borderMuted animate-pulse flex items-start gap-3">
      <div className="devhub-skeleton w-7 h-7 rounded-full flex-shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="devhub-skeleton h-3.5 w-1/3" />
        <div className="devhub-skeleton h-3 w-3/4" />
        <div className="devhub-skeleton h-2.5 w-1/4" />
      </div>
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'repos';
  const page = parseInt(searchParams.get('page') || '1');

  const [inputVal, setInputVal] = useState(query);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('stars');
  const [language, setLanguage] = useState('');

  const debouncedQuery = useDebounce(query, 300);

  // Synchronize local input if URL query changes
  useEffect(() => {
    setInputVal(query);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setTotal(0);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        if (type === 'repos') {
          const params = { q: debouncedQuery, page, sort };
          if (language) params.language = language;
          const res = await api.get('/repos/search', { params });
          setResults(res.data.items || []);
          setTotal(res.data.total_count || 0);
        } else {
          const res = await api.get('/users/search', {
            params: { q: debouncedQuery, page, sort: sort === 'stars' ? 'followers' : sort },
          });
          setResults(res.data.items || []);
          setTotal(res.data.total_count || 0);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Search telemetry failed. Please verify connection or token.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery, page, type, sort, language]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setSearchParams((p) => {
      p.set('q', inputVal.trim());
      p.set('page', '1');
      return p;
    });
  };

  const handleTypeChange = (newType) => {
    setSearchParams((p) => {
      p.set('type', newType);
      p.set('page', '1');
      return p;
    });
  };

  const popularLanguages = [
    'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'Java', 'Ruby', 'PHP', 'Swift', 'Kotlin'
  ];

  const totalPages = Math.min(Math.ceil(total / 20), 50); // GitHub search caps at 1,000 items

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Search Header Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search repositories or developers..."
              className="devhub-input pl-9 w-full py-2 text-xs focus:border-orange-600 focus:ring-orange-600/30"
            />
          </div>
          <button type="submit" className="devhub-btn-orange px-4 py-2 text-xs">
            Query
          </button>
        </form>

        <div className="flex items-center justify-between mt-3 text-xs text-devhub-textMuted font-mono">
          <div>
            {query ? (
              <span>
                {loading ? 'EXECUTING SEARCH...' : `FOUND ${formatNumber(total)} MATCHES FOR "${query}"`}
              </span>
            ) : (
              <span>ENTER A QUERY TO INITIATE TELEMETRY SEARCH</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Left Filters, Right Results */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Filter Sidebar */}
        <aside className="w-full md:w-56 flex-shrink-0 space-y-4">
          
          {/* Search Category Switcher */}
          <div className="devhub-panel p-2">
            <div className="text-[11px] font-mono text-devhub-textMuted px-2 py-1 uppercase tracking-wider font-semibold">
              Category
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => handleTypeChange('repos')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                  type === 'repos'
                    ? 'bg-devhub-surfaceActive text-devhub-brand font-semibold'
                    : 'text-devhub-textSecondary hover:bg-devhub-surfaceHover'
                }`}
              >
                <span>Repositories</span>
                {type === 'repos' && total > 0 && (
                  <span className="devhub-mono-pill text-[10px]">{formatNumber(total)}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('users')}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                  type === 'users'
                    ? 'bg-devhub-surfaceActive text-devhub-brand font-semibold'
                    : 'text-devhub-textSecondary hover:bg-devhub-surfaceHover'
                }`}
              >
                <span>Developers</span>
                {type === 'users' && total > 0 && (
                  <span className="devhub-mono-pill text-[10px]">{formatNumber(total)}</span>
                )}
              </button>
            </div>
          </div>

          {/* Sort Criteria */}
          <div className="devhub-panel p-2">
            <div className="text-[11px] font-mono text-devhub-textMuted px-2 py-1 uppercase tracking-wider font-semibold">
              Sort By
            </div>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setSearchParams((p) => {
                  p.set('page', '1');
                  return p;
                });
              }}
              className="devhub-select w-full mt-1 text-xs"
            >
              <option value="stars">Most Stars</option>
              <option value="forks">Most Forks</option>
              <option value="updated">Recently Updated</option>
              {type === 'users' && <option value="followers">Followers</option>}
            </select>
          </div>

          {/* Languages Filter (for Repos) */}
          {type === 'repos' && (
            <div className="devhub-panel p-2">
              <div className="text-[11px] font-mono text-devhub-textMuted px-2 py-1 uppercase tracking-wider font-semibold">
                Language
              </div>
              <div className="space-y-0.5 mt-1 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('');
                    setSearchParams((p) => {
                      p.set('page', '1');
                      return p;
                    });
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    language === ''
                      ? 'bg-devhub-surfaceActive text-devhub-textPrimary font-semibold'
                      : 'text-devhub-textMuted hover:text-devhub-textSecondary'
                  }`}
                >
                  All Languages
                </button>
                {popularLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setSearchParams((p) => {
                        p.set('page', '1');
                        return p;
                      });
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                      language === lang
                        ? 'bg-devhub-surfaceActive text-devhub-brand font-semibold'
                        : 'text-devhub-textMuted hover:text-devhub-textSecondary'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getLanguageColor(lang) }}
                      />
                      {lang}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Results Stream */}
        <main className="flex-1 w-full min-w-0">
          
          {error && (
            <div className="devhub-panel p-4 mb-4 border-red-500/30 bg-red-950/20 text-xs text-red-400 font-mono">
              [TELEMETRY ERROR] {error}
            </div>
          )}

          <div className="devhub-panel">
            <div className="devhub-panel-header">
              <span>Search Stream</span>
              <span className="font-mono text-[10px] text-devhub-textMuted">
                PAGE {page} OF {totalPages || 1}
              </span>
            </div>

            {loading ? (
              <div className="divide-y divide-devhub-borderMuted">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 px-4">
                <SearchIcon className="w-8 h-8 text-devhub-border mx-auto mb-2" />
                <p className="text-xs font-semibold text-devhub-textPrimary">No results found</p>
                <p className="text-[11px] text-devhub-textMuted mt-1 max-w-sm mx-auto">
                  {query
                    ? `No ${type === 'repos' ? 'repositories' : 'developers'} matched "${query}". Adjust your query or relax the language filter.`
                    : 'Enter keywords in the search bar above to begin searching.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-devhub-borderMuted">
                {results.map((item, idx) => {
                  if (type === 'repos') {
                    const ownerLogin = item.owner?.login || item.full_name.split('/')[0];
                    const repoName = item.name || item.full_name.split('/')[1];
                    return (
                      <div key={item.full_name || idx} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/repo/${ownerLogin}/${repoName}`}
                                className="text-sm font-semibold text-devhub-brand hover:underline truncate"
                              >
                                <span className="text-devhub-textMuted font-normal">{ownerLogin} / </span>
                                {repoName}
                              </Link>
                              <span className="devhub-mono-pill text-[10px]">Public</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-devhub-textMuted">
                              {item.language && (
                                <span className="flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: getLanguageColor(item.language) }}
                                  />
                                  <span className="text-devhub-textSecondary">{item.language}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-mono">
                                <Star className="w-3 h-3 text-devhub-amber" />
                                {formatNumber(item.stargazers_count)}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <GitFork className="w-3 h-3 text-devhub-textMuted" />
                                {formatNumber(item.forks_count)}
                              </span>
                              {item.updated_at && (
                                <span>Updated {timeAgo(item.updated_at)}</span>
                              )}
                            </div>
                            {item.topics && item.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.topics.slice(0, 5).map((t) => (
                                  <span key={t} className="devhub-tag">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/repo/${ownerLogin}/${repoName}`}
                            className="devhub-btn-default py-1 px-2 text-[11px] flex-shrink-0"
                          >
                            Inspect
                          </Link>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.login || idx} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.avatar_url}
                              alt=""
                              className="w-9 h-9 rounded-full border border-devhub-border flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/user/${item.login}`}
                                className="text-sm font-semibold text-devhub-brand hover:underline"
                              >
                                @{item.login}
                              </Link>
                              <div className="flex items-center gap-2 text-[11px] text-devhub-textMuted mt-0.5">
                                <span>{item.type || 'User'}</span>
                                {item.score > 0 && (
                                  <>
                                    <span>&middot;</span>
                                    <span className="font-mono">Relevance: {item.score.toFixed(1)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link
                            to={`/user/${item.login}`}
                            className="devhub-btn-default py-1 px-2.5 text-[11px] flex-shrink-0"
                          >
                            Dossier
                          </Link>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={() => setSearchParams((p) => { p.set('page', String(page - 1)); return p; })}
                disabled={page <= 1}
                className="devhub-btn-default disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs font-mono text-devhub-textMuted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setSearchParams((p) => { p.set('page', String(page + 1)); return p; })}
                disabled={page >= totalPages}
                className="devhub-btn-default disabled:opacity-30"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
