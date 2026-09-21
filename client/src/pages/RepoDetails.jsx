import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, GitFork, AlertCircle, Eye, ExternalLink, Bookmark, Scale, Clock,
  Tag, Loader2, GitCommit, Users, BarChart3, GitCompare, HardDrive, Terminal
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatNumber, getLanguageColor, timeAgo, formatBytes } from '../utils/languages';
import api from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function RepoDetails() {
  const { owner, repo } = useParams();
  const { user: authUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [repoData, setRepoData] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ notes: '', tags: '' });

  useEffect(() => {
    setLoading(true);
    setError('');
    const fetchData = async () => {
      try {
        const [repoRes, contribRes, actRes] = await Promise.allSettled([
          api.get(`/repos/${owner}/${repo}`),
          api.get(`/repos/${owner}/${repo}/contributors`),
          api.get(`/repos/${owner}/${repo}/activity`),
        ]);

        if (repoRes.status === 'rejected') {
          throw new Error(repoRes.reason?.response?.data?.error || `Repository '${owner}/${repo}' not found.`);
        }
        setRepoData(repoRes.value.data);
        setContributors(contribRes.status === 'fulfilled' ? contribRes.value.data.contributors || [] : []);
        setActivity(actRes.status === 'fulfilled' ? actRes.value.data : null);
      } catch (err) {
        setError(err.message || 'Failed to initialize repository telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [owner, repo]);

  const handleSave = async () => {
    if (!authUser) {
      toast.warning('Please sign in to save repositories to your personal workspace');
      return;
    }
    setSaving(true);
    try {
      await api.post('/collections/repos', {
        repo_full_name: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        language: repoData.language,
        notes: noteForm.notes,
        tags: noteForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success(`${repoData.full_name} saved to your workspace.`);
      setShowNoteModal(false);
      setNoteForm({ notes: '', tags: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save repository');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="devhub-panel p-6 mb-6 space-y-4 animate-pulse">
          <div className="devhub-skeleton h-6 w-1/3" />
          <div className="devhub-skeleton h-4 w-2/3" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="devhub-skeleton h-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="devhub-panel p-8 border-red-500/30 bg-red-950/20 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-devhub-textPrimary font-mono">TELEMETRY DIAGNOSTIC FAILED</h2>
          <p className="text-xs text-red-300 mt-1 mb-4">{error}</p>
          <Link to="/search" className="devhub-btn-default text-xs">
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  const langChartData = {
    labels: repoData.languages?.map((l) => l.name) || [],
    datasets: [
      {
        data: repoData.languages?.map((l) => l.bytes) || [],
        backgroundColor: repoData.languages?.map((l) => getLanguageColor(l.name)) || [],
        borderWidth: 0,
        borderRadius: 2,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Workspace Header Panel */}
      <div className="devhub-panel p-5 mb-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <img
              src={repoData.owner?.avatar_url}
              alt=""
              className="w-10 h-10 rounded border border-devhub-border mt-0.5 flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/user/${repoData.owner?.login}`}
                  className="text-sm text-devhub-textMuted hover:text-devhub-brand transition-colors"
                >
                  {repoData.owner?.login}
                </Link>
                <span className="text-devhub-border text-sm">/</span>
                <span className="text-base font-bold text-devhub-textPrimary">{repoData.name}</span>
                <span className="devhub-mono-pill text-[10px]">{repoData.visibility || 'public'}</span>
                {activity?.latest_release && (
                  <span className="devhub-mono-pill text-[10px] text-devhub-action border-devhub-action/30">
                    Release: {activity.latest_release.tag_name}
                  </span>
                )}
              </div>
              {repoData.description && (
                <p className="text-xs text-devhub-textSecondary mt-1.5 max-w-3xl leading-relaxed">
                  {repoData.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Ribbon */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <Link
              to={`/compare/repos?repo1=${encodeURIComponent(repoData.full_name)}`}
              className="devhub-btn-default text-xs"
            >
              <GitCompare className="w-3.5 h-3.5" /> Benchmark
            </Link>
            <button
              onClick={() => setShowNoteModal(true)}
              className="devhub-btn-default text-xs"
            >
              <Bookmark className="w-3.5 h-3.5" /> Save to Workspace
            </button>
            <a
              href={repoData.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="devhub-btn-subtle text-xs border border-devhub-border"
            >
              <ExternalLink className="w-3 h-3" /> GitHub
            </a>
          </div>
        </div>

        {/* Telemetry Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-4 border-t border-devhub-borderMuted">
          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <Star className="w-3 h-3 text-devhub-amber" /> Stars
            </div>
            <div className="text-base font-bold font-mono text-devhub-textPrimary mt-0.5">
              {formatNumber(repoData.stargazers_count)}
            </div>
          </div>

          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <GitFork className="w-3 h-3 text-devhub-brand" /> Forks
            </div>
            <div className="text-base font-bold font-mono text-devhub-textPrimary mt-0.5">
              {formatNumber(repoData.forks_count)}
            </div>
          </div>

          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <Eye className="w-3 h-3 text-devhub-cyan" /> Watchers
            </div>
            <div className="text-base font-bold font-mono text-devhub-textPrimary mt-0.5">
              {formatNumber(repoData.watchers_count)}
            </div>
          </div>

          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-devhub-red" /> Issues
            </div>
            <div className="text-base font-bold font-mono text-devhub-textPrimary mt-0.5">
              {formatNumber(repoData.open_issues_count)}
            </div>
          </div>

          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-devhub-purple" /> Disk Size
            </div>
            <div className="text-base font-bold font-mono text-devhub-textPrimary mt-0.5">
              {formatBytes(repoData.size * 1024)}
            </div>
          </div>

          <div className="devhub-panel-inset p-2.5">
            <div className="text-[10px] font-mono text-devhub-textMuted uppercase flex items-center gap-1">
              <Scale className="w-3 h-3 text-devhub-textMuted" /> License
            </div>
            <div className="text-xs font-semibold text-devhub-textPrimary mt-1 truncate">
              {repoData.license || 'Proprietary / None'}
            </div>
          </div>
        </div>

        {/* Topics */}
        {repoData.topics && repoData.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-devhub-borderMuted">
            {repoData.topics.map((t) => (
              <span key={t} className="devhub-tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Analytical Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-devhub-border mb-5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`devhub-tab ${activeTab === 'overview' ? 'devhub-tab-active' : ''}`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Overview &amp; Languages
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`devhub-tab ${activeTab === 'activity' ? 'devhub-tab-active' : ''}`}
        >
          <GitCommit className="w-3.5 h-3.5" /> Commit Velocity ({activity?.recent_commits?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('contributors')}
          className={`devhub-tab ${activeTab === 'contributors' ? 'devhub-tab-active' : ''}`}
        >
          <Users className="w-3.5 h-3.5" /> Contributor Network ({contributors.length})
        </button>
      </div>

      {/* Tab Content 1: Overview & Languages */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          
          {/* Segmented Language Distribution Bar */}
          {repoData.languages && repoData.languages.length > 0 ? (
            <div className="devhub-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-devhub-textMuted font-mono">
                  Codebase Language Composition ({formatBytes(repoData.total_language_bytes)})
                </h3>
              </div>

              {/* Segmented Horizontal Bar */}
              <div className="h-3 w-full rounded overflow-hidden flex bg-devhub-subtle border border-devhub-borderMuted mb-4">
                {repoData.languages.map((l) => (
                  <div
                    key={l.name}
                    style={{
                      width: `${l.percentage}%`,
                      backgroundColor: getLanguageColor(l.name),
                    }}
                    title={`${l.name}: ${l.percentage}% (${formatBytes(l.bytes)})`}
                    className="h-full transition-all duration-300"
                  />
                ))}
              </div>

              {/* Language Metrics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                {repoData.languages.map((l) => (
                  <div key={l.name} className="flex items-center justify-between p-2 rounded bg-devhub-subtle/60 border border-devhub-borderMuted">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getLanguageColor(l.name) }}
                      />
                      <span className="font-medium text-devhub-textPrimary truncate">{l.name}</span>
                    </div>
                    <div className="text-right font-mono text-[11px] text-devhub-textMuted flex-shrink-0 ml-2">
                      <span className="text-devhub-textSecondary font-semibold">{l.percentage}%</span>
                      <span className="block text-[10px]">{formatBytes(l.bytes)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-6 pt-5 border-t border-devhub-borderMuted">
                <div className="h-44">
                  <Bar
                    data={langChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          display: true,
                          grid: { color: '#21262d' },
                          ticks: {
                            color: '#7d8590',
                            font: { size: 10, family: 'ui-monospace' },
                            callback: (v) => formatBytes(v),
                          },
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: '#c9d1d9', font: { size: 10 } },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="devhub-panel p-6 text-center text-xs text-devhub-textMuted">
              No language telemetry published for this repository.
            </div>
          )}

          {/* Technical Metadata Panel */}
          <div className="devhub-panel p-4">
            <div className="text-[11px] font-mono text-devhub-textMuted uppercase mb-3 font-semibold">
              Repository Specification
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-devhub-textMuted block text-[10px]">DEFAULT BRANCH</span>
                <span className="text-devhub-textPrimary font-semibold">{repoData.default_branch || 'main'}</span>
              </div>
              <div>
                <span className="text-devhub-textMuted block text-[10px]">INITIAL COMMIT DATE</span>
                <span className="text-devhub-textPrimary">{new Date(repoData.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-devhub-textMuted block text-[10px]">LAST RECORDED PUSH</span>
                <span className="text-devhub-textPrimary">{timeAgo(repoData.pushed_at)}</span>
              </div>
              <div>
                <span className="text-devhub-textMuted block text-[10px]">HOMEPAGE URL</span>
                {repoData.homepage ? (
                  <a
                    href={repoData.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-devhub-brand hover:underline truncate block"
                  >
                    {repoData.homepage.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  <span className="text-devhub-textMuted">None configured</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Commit Velocity */}
      {activeTab === 'activity' && (
        <div className="devhub-panel">
          <div className="devhub-panel-header">
            <span>Recent Commit Stream ({activity?.recent_commits?.length || 0} commits analyzed)</span>
            {activity?.latest_release && (
              <span className="devhub-mono-pill text-devhub-action border-devhub-action/30">
                Latest Release: {activity.latest_release.tag_name} ({timeAgo(activity.latest_release.published_at)})
              </span>
            )}
          </div>
          
          {activity?.recent_commits && activity.recent_commits.length > 0 ? (
            <div className="divide-y divide-devhub-borderMuted">
              {activity.recent_commits.map((c) => (
                <div key={c.sha} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors flex items-start gap-3">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="w-6 h-6 rounded-full mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-devhub-surfaceActive flex items-center justify-center font-mono text-[10px] text-devhub-textMuted flex-shrink-0 mt-0.5">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-devhub-textPrimary leading-snug">
                      {c.message.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-devhub-textMuted font-mono">
                      <span className="text-devhub-textSecondary">{c.author_name}</span>
                      <span>&middot;</span>
                      <span>committed {timeAgo(c.author_date)}</span>
                    </div>
                  </div>
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="devhub-mono-pill text-[10px] text-devhub-brand hover:underline flex-shrink-0"
                  >
                    {c.sha?.slice(0, 7)}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-devhub-textMuted">
              No recent commits could be retrieved for this repository.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Contributor Network */}
      {activeTab === 'contributors' && (
        <div className="devhub-panel">
          <div className="devhub-panel-header">
            <span>Key Contributors ({contributors.length})</span>
            <span className="text-[10px] font-mono text-devhub-textMuted">RANKED BY COMMIT VOLUME</span>
          </div>

          {contributors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px bg-devhub-borderMuted">
              {contributors.map((c) => (
                <div key={c.login} className="p-3 bg-devhub-surface flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={c.avatar_url} alt="" className="w-8 h-8 rounded-full border border-devhub-border flex-shrink-0" />
                    <div className="min-w-0">
                      <Link
                        to={`/user/${c.login}`}
                        className="text-xs font-semibold text-devhub-brand hover:underline truncate block"
                      >
                        @{c.login}
                      </Link>
                      <span className="text-[10px] font-mono text-devhub-textMuted">
                        {formatNumber(c.contributions)} commits
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/user/${c.login}`}
                    className="devhub-btn-default py-1 px-2 text-[10px] flex-shrink-0"
                  >
                    Dossier
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-devhub-textMuted">
              No contributors could be extracted for this repository.
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showNoteModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="devhub-panel w-full max-w-md p-5 bg-devhub-surface border border-devhub-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-devhub-borderMuted mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-devhub-textPrimary font-mono">
                Curate Repository to Workspace
              </h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="devhub-btn-subtle p-1 text-devhub-textMuted"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">NOTES</label>
                <textarea
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  placeholder="Record architectural notes, evaluation criteria, or migration plans..."
                  className="devhub-input w-full h-20 resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">
                  TAGS (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  placeholder="frontend, state-management, benchmark-q3"
                  className="devhub-input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-devhub-borderMuted">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="devhub-btn-default"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="devhub-btn-primary"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
