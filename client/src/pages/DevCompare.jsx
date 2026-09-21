import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, Search, Loader2, ArrowRight, ExternalLink, Calendar, Building, MapPin } from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { formatNumber, timeAgo } from '../utils/languages';
import api from '../utils/api';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function DevComparisonRow({ label, val1, val2, formattedVal1, formattedVal2 }) {
  const v1 = typeof val1 === 'number' ? val1 : 0;
  const v2 = typeof val2 === 'number' ? val2 : 0;
  const total = v1 + v2 || 1;
  const pct1 = Math.round((v1 / total) * 100);
  const pct2 = 100 - pct1;

  const isVal1Higher = v1 > v2;
  const isVal2Higher = v2 > v1;
  const isTie = v1 === v2;

  return (
    <div className="py-2.5 px-4 border-b border-devhub-borderMuted hover:bg-devhub-surfaceHover transition-colors">
      <div className="grid grid-cols-12 items-center gap-2 text-xs">
        <div className={`col-span-3 text-right font-mono ${!isTie && isVal1Higher ? 'font-bold text-devhub-textPrimary' : 'text-devhub-textMuted'}`}>
          {formattedVal1 !== undefined ? formattedVal1 : formatNumber(v1)}
        </div>

        <div className="col-span-6 text-center">
          <span className="font-medium text-devhub-textSecondary block text-xs">{label}</span>
          <div className="w-full bg-devhub-subtle h-1.5 rounded-full overflow-hidden flex mt-1 border border-devhub-borderMuted">
            <div
              style={{ width: `${pct1}%` }}
              className={`h-full transition-all ${isVal1Higher ? 'bg-devhub-brand' : 'bg-devhub-border'}`}
            />
            <div
              style={{ width: `${pct2}%` }}
              className={`h-full transition-all ${isVal2Higher ? 'bg-devhub-action' : 'bg-devhub-border'}`}
            />
          </div>
        </div>

        <div className={`col-span-3 text-left font-mono ${!isTie && isVal2Higher ? 'font-bold text-devhub-textPrimary' : 'text-devhub-textMuted'}`}>
          {formattedVal2 !== undefined ? formattedVal2 : formatNumber(v2)}
        </div>
      </div>
    </div>
  );
}

export default function DevCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUser1 = searchParams.get('user1') || '';
  const initialUser2 = searchParams.get('user2') || '';

  const [user1Input, setUser1Input] = useState(initialUser1);
  const [user2Input, setUser2Input] = useState(initialUser2);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeCompare = async (u1, u2) => {
    if (!u1.trim() || !u2.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/compare', {
        params: { user1: u1.trim(), user2: u2.trim() },
      });
      setCompareData(res.data);
      setSearchParams({ user1: u1.trim(), user2: u2.trim() });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to benchmark developers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUser1 && initialUser2) {
      executeCompare(initialUser1, initialUser2);
    }
  }, [initialUser1, initialUser2]);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeCompare(user1Input, user2Input);
  };

  const presets = [
    { label: 'Linus vs Dan Abramov', u1: 'torvalds', u2: 'gaearon' },
    { label: 'Anthony Fu vs Evan You', u1: 'antfu', u2: 'yyx990803' },
    { label: 'TJ Holowaychuk vs Sindre Sorhus', u1: 'tj', u2: 'sindresorhus' },
  ];

  const getRadarData = () => {
    if (!compareData) return null;
    const u1 = compareData.user1;
    const u2 = compareData.user2;
    const maxRepos = Math.max(u1.public_repos, u2.public_repos, 1);
    const maxGists = Math.max(u1.public_gists, u2.public_gists, 1);
    const maxFollowers = Math.max(u1.followers, u2.followers, 1);
    const maxFollowing = Math.max(u1.following, u2.following, 1);
    const age1 = Math.floor((Date.now() - new Date(u1.created_at)) / (365.25 * 24 * 60 * 60 * 1000));
    const age2 = Math.floor((Date.now() - new Date(u2.created_at)) / (365.25 * 24 * 60 * 60 * 1000));
    const maxAge = Math.max(age1, age2, 1);

    return {
      labels: ['Public Repos', 'Public Gists', 'Followers', 'Following', 'Account Age'],
      datasets: [
        {
          label: `@${u1.login}`,
          data: [
            (u1.public_repos / maxRepos) * 100,
            (u1.public_gists / maxGists) * 100,
            (u1.followers / maxFollowers) * 100,
            (u1.following / maxFollowing) * 100,
            (age1 / maxAge) * 100,
          ],
          backgroundColor: 'rgba(56, 139, 253, 0.15)',
          borderColor: '#388bfd',
          borderWidth: 1.5,
          pointBackgroundColor: '#388bfd',
          pointRadius: 3,
        },
        {
          label: `@${u2.login}`,
          data: [
            (u2.public_repos / maxRepos) * 100,
            (u2.public_gists / maxGists) * 100,
            (u2.followers / maxFollowers) * 100,
            (u2.following / maxFollowing) * 100,
            (age2 / maxAge) * 100,
          ],
          backgroundColor: 'rgba(35, 134, 54, 0.15)',
          borderColor: '#2ea043',
          borderWidth: 1.5,
          pointBackgroundColor: '#2ea043',
          pointRadius: 3,
        },
      ],
    };
  };

  const getDevScore = (u) => {
    const age = Math.floor((Date.now() - new Date(u.created_at)) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.round((u.followers * 2) + (u.public_repos * 10) + (u.public_gists * 5) + (age * 20));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-devhub-brand font-semibold uppercase">
          <Users className="w-3.5 h-3.5" /> Engineering Comparison Matrix
        </div>
        <h1 className="text-xl font-bold text-devhub-textPrimary mt-1">
          Developer Head-to-Head Comparison
        </h1>
        <p className="text-xs text-devhub-textMuted mt-0.5">
          Objective capability and community reach benchmarking between two GitHub engineers.
        </p>
      </div>

      {/* Query Console */}
      <form onSubmit={handleSubmit} className="devhub-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono text-devhub-textMuted block mb-1">DEVELOPER 1 (USERNAME)</label>
            <input
              type="text"
              value={user1Input}
              onChange={(e) => setUser1Input(e.target.value)}
              placeholder="e.g. torvalds"
              className="devhub-input w-full font-mono text-xs"
              required
            />
          </div>
          <span className="text-xs font-mono text-devhub-textMuted mt-4 hidden md:inline">VS</span>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono text-devhub-textMuted block mb-1">DEVELOPER 2 (USERNAME)</label>
            <input
              type="text"
              value={user2Input}
              onChange={(e) => setUser2Input(e.target.value)}
              placeholder="e.g. gaearon"
              className="devhub-input w-full font-mono text-xs"
              required
            />
          </div>
          <div className="mt-4 w-full md:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="devhub-btn-primary w-full md:w-auto px-5 py-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Compare Profiles
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-devhub-borderMuted text-xs">
          <span className="text-[10px] font-mono text-devhub-textMuted">PRESETS:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setUser1Input(p.u1);
                setUser2Input(p.u2);
                executeCompare(p.u1, p.u2);
              }}
              className="devhub-btn-subtle py-0.5 px-2 text-[11px] border border-devhub-borderMuted"
            >
              {p.label}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="devhub-panel p-4 mb-6 border-red-500/30 bg-red-950/20 text-xs text-red-400 font-mono">
          [BENCHMARK ERROR] {error}
        </div>
      )}

      {compareData && (
        <div className="space-y-6">
          
          {/* Side-by-Side Target Dossiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[compareData.user1, compareData.user2].map((u, i) => (
              <div key={u.login} className="devhub-panel p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="devhub-mono-pill text-[10px] text-devhub-textMuted uppercase">
                    {i === 0 ? 'Engineer A' : 'Engineer B'}
                  </span>
                  <Link
                    to={`/user/${u.login}`}
                    className="text-xs text-devhub-textMuted hover:text-devhub-brand flex items-center gap-1"
                  >
                    View Full Dossier &rarr;
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full border border-devhub-border flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-devhub-textPrimary">{u.name || u.login}</h3>
                    <div className="font-mono text-xs text-devhub-brand">@{u.login}</div>
                    {u.bio && (
                      <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-1">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-devhub-borderMuted text-[11px] text-devhub-textMuted font-mono">
                  {u.company && <span>{u.company}</span>}
                  {u.location && <span>{u.location}</span>}
                  <span>Joined {new Date(u.created_at).getFullYear()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Comparison Matrix */}
          <div className="devhub-panel">
            <div className="devhub-panel-header">
              <span className="font-mono text-devhub-brand">@{compareData.user1.login}</span>
              <span className="text-[10px] font-mono text-devhub-textMuted">ENGINEERING METRICS</span>
              <span className="font-mono text-devhub-action">@{compareData.user2.login}</span>
            </div>

            <div>
              <DevComparisonRow
                label="Community Reach (Followers)"
                val1={compareData.user1.followers}
                val2={compareData.user2.followers}
              />
              <DevComparisonRow
                label="Public Codebases (Repositories)"
                val1={compareData.user1.public_repos}
                val2={compareData.user2.public_repos}
              />
              <DevComparisonRow
                label="Code Snippets & Gists"
                val1={compareData.user1.public_gists}
                val2={compareData.user2.public_gists}
              />
              <DevComparisonRow
                label="Following Network"
                val1={compareData.user1.following}
                val2={compareData.user2.following}
              />
              <DevComparisonRow
                label="Account Longevity (Years Active)"
                val1={Math.floor((Date.now() - new Date(compareData.user1.created_at)) / (365.25 * 24 * 60 * 60 * 1000))}
                val2={Math.floor((Date.now() - new Date(compareData.user2.created_at)) / (365.25 * 24 * 60 * 60 * 1000))}
                formattedVal1={`${Math.floor((Date.now() - new Date(compareData.user1.created_at)) / (365.25 * 24 * 60 * 60 * 1000))} yrs`}
                formattedVal2={`${Math.floor((Date.now() - new Date(compareData.user2.created_at)) / (365.25 * 24 * 60 * 60 * 1000))} yrs`}
              />
              <DevComparisonRow
                label="Composite Developer Score"
                val1={getDevScore(compareData.user1)}
                val2={getDevScore(compareData.user2)}
              />
            </div>
          </div>

          {/* Radar Telemetry */}
          <div className="devhub-panel p-4">
            <div className="text-[11px] font-mono text-devhub-textMuted uppercase mb-3 font-semibold text-center">
              Multivariate Developer Capability Radar
            </div>
            <div className="h-64 max-w-lg mx-auto">
              <Radar
                data={getRadarData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      angleLines: { color: '#21262d' },
                      grid: { color: '#21262d' },
                      pointLabels: { color: '#7d8590', font: { size: 10, family: 'ui-monospace' } },
                      ticks: { display: false },
                      suggestedMin: 0,
                      suggestedMax: 100,
                    },
                  },
                  plugins: {
                    legend: {
                      labels: { color: '#c9d1d9', font: { size: 11 } },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {!compareData && !loading && (
        <div className="devhub-panel p-16 text-center">
          <Users className="w-10 h-10 text-devhub-border mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-devhub-textPrimary">Developer Benchmarking Engine Ready</h3>
          <p className="text-xs text-devhub-textMuted mt-1 max-w-sm mx-auto">
            Specify any two GitHub usernames above (e.g. <span className="font-mono text-devhub-textSecondary">torvalds</span> vs <span className="font-mono text-devhub-textSecondary">gaearon</span>) to generate comparative developer intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
