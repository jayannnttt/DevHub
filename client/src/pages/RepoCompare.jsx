import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, Search, Star, GitFork, AlertCircle, Eye, Loader2, ArrowRight, HardDrive, Activity, ExternalLink } from 'lucide-react';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend
} from 'chart.js';
import { formatNumber, getLanguageColor, timeAgo, formatBytes } from '../utils/languages';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function ComparisonRow({ label, val1, val2, formattedVal1, formattedVal2, lowerBetter = false }) {
  const v1 = typeof val1 === 'number' ? val1 : 0;
  const v2 = typeof val2 === 'number' ? val2 : 0;
  const total = v1 + v2 || 1;
  const pct1 = Math.round((v1 / total) * 100);
  const pct2 = 100 - pct1;

  const isVal1Higher = lowerBetter ? v1 < v2 : v1 > v2;
  const isVal2Higher = lowerBetter ? v2 < v1 : v2 > v1;
  const isTie = v1 === v2;

  return (
    <div className="py-2.5 px-4 border-b border-devhub-borderMuted hover:bg-devhub-surfaceHover transition-colors">
      <div className="grid grid-cols-12 items-center gap-2 text-xs">
        {/* Value 1 */}
        <div className={`col-span-3 text-right font-mono ${!isTie && isVal1Higher ? 'font-bold text-devhub-textPrimary' : 'text-devhub-textMuted'}`}>
          {formattedVal1 !== undefined ? formattedVal1 : formatNumber(v1)}
        </div>

        {/* Metric Label */}
        <div className="col-span-6 text-center">
          <span className="font-medium text-devhub-textSecondary block text-xs">{label}</span>
          <div className="w-full bg-devhub-subtle h-1.5 rounded-full overflow-hidden flex mt-1 border border-devhub-borderMuted">
            <div
              style={{ width: `${pct1}%` }}
              className={`h-full transition-all ${isVal1Higher ? 'bg-devhub-brand' : 'bg-devhub-border'}`}
            />
            <div
              style={{ width: `${pct2}%` }}
              className={`h-full transition-all ${isVal2Higher ? 'bg-devhub-purple' : 'bg-devhub-border'}`}
            />
          </div>
        </div>

        {/* Value 2 */}
        <div className={`col-span-3 text-left font-mono ${!isTie && isVal2Higher ? 'font-bold text-devhub-textPrimary' : 'text-devhub-textMuted'}`}>
          {formattedVal2 !== undefined ? formattedVal2 : formatNumber(v2)}
        </div>
      </div>
    </div>
  );
}

export default function RepoCompare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRepo1 = searchParams.get('repo1') || '';
  const initialRepo2 = searchParams.get('repo2') || '';

  const [repo1Input, setRepo1Input] = useState(initialRepo1);
  const [repo2Input, setRepo2Input] = useState(initialRepo2);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeCompare = async (r1, r2) => {
    if (!r1.trim() || !r2.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/repos/compare', {
        params: { repo1: r1.trim(), repo2: r2.trim() },
      });
      setCompareData(res.data);
      setSearchParams({ repo1: r1.trim(), repo2: r2.trim() });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to benchmark repositories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRepo1 && initialRepo2) {
      executeCompare(initialRepo1, initialRepo2);
    }
  }, [initialRepo1, initialRepo2]);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeCompare(repo1Input, repo2Input);
  };

  const presets = [
    { label: 'React vs Vue', r1: 'facebook/react', r2: 'vuejs/core' },
    { label: 'Next.js vs Remix', r1: 'vercel/next.js', r2: 'remix-run/remix' },
    { label: 'Deno vs Bun', r1: 'denoland/deno', r2: 'oven-sh/bun' },
    { label: 'Vite vs Webpack', r1: 'vitejs/vite', r2: 'webpack/webpack' },
  ];

  const getRadarData = () => {
    if (!compareData) return null;
    const r1 = compareData.repo1;
    const r2 = compareData.repo2;
    const maxStars = Math.max(r1.stargazers_count, r2.stargazers_count, 1);
    const maxForks = Math.max(r1.forks_count, r2.forks_count, 1);
    const maxWatchers = Math.max(r1.watchers_count, r2.watchers_count, 1);
    const maxIssues = Math.max(r1.open_issues_count, r2.open_issues_count, 1);
    const maxLangs = Math.max(Object.keys(r1.languages || {}).length, Object.keys(r2.languages || {}).length, 1);
    const maxActivity = Math.max(r1.activity_score, r2.activity_score, 1);

    return {
      labels: ['Stars', 'Forks', 'Watchers', 'Issues', 'Languages', 'Activity'],
      datasets: [
        {
          label: r1.full_name,
          data: [
            (r1.stargazers_count / maxStars) * 100,
            (r1.forks_count / maxForks) * 100,
            (r1.watchers_count / maxWatchers) * 100,
            (r1.open_issues_count / maxIssues) * 100,
            (Object.keys(r1.languages || {}).length / maxLangs) * 100,
            (r1.activity_score / maxActivity) * 100,
          ],
          backgroundColor: 'rgba(56, 139, 253, 0.15)',
          borderColor: '#388bfd',
          borderWidth: 1.5,
          pointBackgroundColor: '#388bfd',
          pointRadius: 3,
        },
        {
          label: r2.full_name,
          data: [
            (r2.stargazers_count / maxStars) * 100,
            (r2.forks_count / maxForks) * 100,
            (r2.watchers_count / maxWatchers) * 100,
            (r2.open_issues_count / maxIssues) * 100,
            (Object.keys(r2.languages || {}).length / maxLangs) * 100,
            (r2.activity_score / maxActivity) * 100,
          ],
          backgroundColor: 'rgba(188, 140, 255, 0.15)',
          borderColor: '#bc8cff',
          borderWidth: 1.5,
          pointBackgroundColor: '#bc8cff',
          pointRadius: 3,
        },
      ],
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-devhub-brand font-semibold uppercase">
          <GitCompare className="w-3.5 h-3.5" /> Benchmarking Matrix
        </div>
        <h1 className="text-xl font-bold text-devhub-textPrimary mt-1">
          Repository Head-to-Head Comparison
        </h1>
        <p className="text-xs text-devhub-textMuted mt-0.5">
          Objective telemetry matrix comparing codebase adoption, community reach, and repository velocity.
        </p>
      </div>

      {/* Query Formulation Console */}
      <form onSubmit={handleSubmit} className="devhub-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono text-devhub-textMuted block mb-1">PRIMARY REPOSITORY</label>
            <input
              type="text"
              value={repo1Input}
              onChange={(e) => setRepo1Input(e.target.value)}
              placeholder="owner/repo (e.g. facebook/react)"
              className="devhub-input w-full font-mono text-xs"
              required
            />
          </div>
          <span className="text-xs font-mono text-devhub-textMuted mt-4 hidden md:inline">VS</span>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono text-devhub-textMuted block mb-1">COMPARATIVE REPOSITORY</label>
            <input
              type="text"
              value={repo2Input}
              onChange={(e) => setRepo2Input(e.target.value)}
              placeholder="owner/repo (e.g. vuejs/core)"
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
              Execute Benchmark
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
                setRepo1Input(p.r1);
                setRepo2Input(p.r2);
                executeCompare(p.r1, p.r2);
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
          
          {/* Side-by-Side Target Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[compareData.repo1, compareData.repo2].map((r, i) => (
              <div key={r.full_name} className="devhub-panel p-4">
                <div className="flex items-center justify-between">
                  <span className="devhub-mono-pill text-[10px] text-devhub-textMuted uppercase">
                    {i === 0 ? 'Target A' : 'Target B'}
                  </span>
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-devhub-textMuted hover:text-devhub-brand flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> GitHub
                  </a>
                </div>
                <h3 className="text-base font-bold text-devhub-textPrimary mt-2">
                  <Link to={`/repo/${r.full_name}`} className="hover:underline">
                    {r.full_name}
                  </Link>
                </h3>
                <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-2 leading-relaxed">
                  {r.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-devhub-borderMuted text-[11px] text-devhub-textMuted font-mono">
                  <span>License: {r.license || 'None'}</span>
                  <span>&middot;</span>
                  <span>Primary: {r.language || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metric Comparison Matrix */}
          <div className="devhub-panel">
            <div className="devhub-panel-header">
              <span className="font-mono text-devhub-brand truncate">{compareData.repo1.full_name}</span>
              <span className="text-[10px] font-mono text-devhub-textMuted">TELEMETRY BENCHMARK</span>
              <span className="font-mono text-devhub-purple truncate">{compareData.repo2.full_name}</span>
            </div>

            <div>
              <ComparisonRow
                label="Stargazers (Adoption)"
                val1={compareData.repo1.stargazers_count}
                val2={compareData.repo2.stargazers_count}
              />
              <ComparisonRow
                label="Network Forks (Ecosystem Reach)"
                val1={compareData.repo1.forks_count}
                val2={compareData.repo2.forks_count}
              />
              <ComparisonRow
                label="Subscribers / Watchers"
                val1={compareData.repo1.watchers_count}
                val2={compareData.repo2.watchers_count}
              />
              <ComparisonRow
                label="Open Issue Backlog"
                val1={compareData.repo1.open_issues_count}
                val2={compareData.repo2.open_issues_count}
                lowerBetter={true}
              />
              <ComparisonRow
                label="Repository Size"
                val1={compareData.repo1.size}
                val2={compareData.repo2.size}
                formattedVal1={formatBytes(compareData.repo1.size * 1024)}
                formattedVal2={formatBytes(compareData.repo2.size * 1024)}
                lowerBetter={true}
              />
              <ComparisonRow
                label="Computed Activity Velocity Score"
                val1={compareData.repo1.activity_score}
                val2={compareData.repo2.activity_score}
              />
            </div>
          </div>

          {/* Radar Telemetry & Language Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Radar Diagnostics */}
            <div className="devhub-panel p-4">
              <div className="text-[11px] font-mono text-devhub-textMuted uppercase mb-3 font-semibold">
                Multivariate Balance Radar
              </div>
              <div className="h-64">
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

            {/* Language Architecture Comparison */}
            <div className="devhub-panel p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono text-devhub-textMuted uppercase mb-3 font-semibold">
                  Language Footprint Comparison
                </div>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="font-semibold text-devhub-brand font-mono text-[11px] mb-1">
                      {compareData.repo1.full_name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(compareData.repo1.languages || {}).slice(0, 6).map((lang) => (
                        <span key={lang} className="devhub-mono-pill text-[10px]">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-devhub-purple font-mono text-[11px] mb-1">
                      {compareData.repo2.full_name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(compareData.repo2.languages || {}).slice(0, 6).map((lang) => (
                        <span key={lang} className="devhub-mono-pill text-[10px]">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-devhub-borderMuted text-[11px] text-devhub-textMuted">
                Activity score calculated algorithmically using normalized stargazers, network forks, and subscriber volume.
              </div>
            </div>
          </div>
        </div>
      )}

      {!compareData && !loading && (
        <div className="devhub-panel p-16 text-center">
          <GitCompare className="w-10 h-10 text-devhub-border mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-devhub-textPrimary">Benchmarking Engine Ready</h3>
          <p className="text-xs text-devhub-textMuted mt-1 max-w-sm mx-auto">
            Input any two GitHub repositories above (e.g. <span className="font-mono text-devhub-textSecondary">facebook/react</span> vs <span className="font-mono text-devhub-textSecondary">vuejs/core</span>) to compute real-time comparative telemetry.
          </p>
        </div>
      )}
    </div>
  );
}
