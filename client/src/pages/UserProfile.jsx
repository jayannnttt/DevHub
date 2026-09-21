import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, GitFork, Users, MapPin, Building, Link as LinkIcon,
  Calendar, Bookmark, ExternalLink, Loader2, GitCompare, Code2, AlertCircle
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatNumber, getLanguageColor, timeAgo } from '../utils/languages';
import api from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function UserProfile() {
  const { username } = useParams();
  const { user: authUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('repos');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ notes: '', tags: '' });
  const [repoSearch, setRepoSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/users/${username}`)
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || `Developer '@${username}' not found in GitHub telemetry.`);
        setLoading(false);
      });
  }, [username]);

  const handleSave = async () => {
    if (!authUser) {
      toast.warning('Please sign in to save developers to your workspace');
      return;
    }
    setSaving(true);
    try {
      await api.post('/collections/developers', {
        github_username: profile.login,
        github_name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        notes: noteForm.notes,
        tags: noteForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success(`@${profile.login} curated into your workspace.`);
      setShowNoteModal(false);
      setNoteForm({ notes: '', tags: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save developer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 animate-pulse">
          <div className="w-full md:w-72 devhub-panel p-5 space-y-3">
            <div className="devhub-skeleton w-24 h-24 rounded-full mx-auto" />
            <div className="devhub-skeleton h-5 w-3/4 mx-auto" />
            <div className="devhub-skeleton h-4 w-1/2 mx-auto" />
            <div className="devhub-skeleton h-16 w-full" />
          </div>
          <div className="flex-1 devhub-panel p-5 space-y-4">
            <div className="devhub-skeleton h-8 w-1/3" />
            <div className="devhub-skeleton h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="devhub-panel p-8 border-red-500/30 bg-red-950/20">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-devhub-textPrimary font-mono">DEVELOPER NOT FOUND</h2>
          <p className="text-xs text-red-300 mt-1 mb-4">{error}</p>
          <Link to="/search?type=users" className="devhub-btn-default text-xs">
            Search Developers
          </Link>
        </div>
      </div>
    );
  }

  const langChartData = {
    labels: profile.top_languages?.map((l) => l.language) || [],
    datasets: [
      {
        data: profile.top_languages?.map((l) => l.count) || [],
        backgroundColor: profile.top_languages?.map((l) => getLanguageColor(l.language)) || [],
        borderWidth: 1,
        borderColor: '#161b22',
      },
    ],
  };

  const filteredRepos = (profile.repos || []).filter((r) => {
    if (!repoSearch.trim()) return true;
    const term = repoSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.description && r.description.toLowerCase().includes(term)) ||
      (r.language && r.language.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Top Dossier Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Column: Developer Dossier Sidebar */}
        <aside className="w-full md:w-72 flex-shrink-0 space-y-4">
          <div className="devhub-panel p-5">
            {/* Avatar & Identifiers */}
            <div className="text-center pb-4 border-b border-devhub-borderMuted">
              <img
                src={profile.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full border-2 border-devhub-border mx-auto shadow-md"
              />
              <h1 className="text-base font-bold text-devhub-textPrimary mt-3">
                {profile.name || profile.login}
              </h1>
              <div className="font-mono text-xs text-devhub-textMuted mt-0.5">@{profile.login}</div>
              {profile.bio && (
                <p className="text-xs text-devhub-textSecondary mt-2.5 leading-relaxed text-left">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Career Telemetry Numbers */}
            <div className="grid grid-cols-2 gap-2 py-3 border-b border-devhub-borderMuted text-xs font-mono">
              <div className="devhub-panel-inset p-2">
                <span className="text-[10px] text-devhub-textMuted block">LIFETIME STARS</span>
                <span className="text-sm font-bold text-devhub-amber">
                  {formatNumber(profile.total_stars)}
                </span>
              </div>
              <div className="devhub-panel-inset p-2">
                <span className="text-[10px] text-devhub-textMuted block">LIFETIME FORKS</span>
                <span className="text-sm font-bold text-devhub-brand">
                  {formatNumber(profile.total_forks)}
                </span>
              </div>
              <div className="devhub-panel-inset p-2">
                <span className="text-[10px] text-devhub-textMuted block">PUBLIC REPOS</span>
                <span className="text-sm font-bold text-devhub-textPrimary">
                  {profile.public_repos}
                </span>
              </div>
              <div className="devhub-panel-inset p-2">
                <span className="text-[10px] text-devhub-textMuted block">COMMUNITY REACH</span>
                <span className="text-sm font-bold text-devhub-textPrimary">
                  {formatNumber(profile.followers)} <span className="text-[10px] font-normal text-devhub-textMuted">flw</span>
                </span>
              </div>
            </div>

            {/* Metadata Roster */}
            <div className="py-3 space-y-2 text-xs border-b border-devhub-borderMuted text-devhub-textMuted">
              {profile.company && (
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 flex-shrink-0 text-devhub-textSecondary" />
                  <span className="text-devhub-textSecondary truncate">{profile.company}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-devhub-textSecondary" />
                  <span className="text-devhub-textSecondary truncate">{profile.location}</span>
                </div>
              )}
              {profile.blog && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 flex-shrink-0 text-devhub-textSecondary" />
                  <a
                    href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-devhub-brand hover:underline truncate"
                  >
                    {profile.blog.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-devhub-textMuted" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Action Ribbon */}
            <div className="pt-3 space-y-2">
              <button
                onClick={() => setShowNoteModal(true)}
                className="devhub-btn-default w-full py-2"
              >
                <Bookmark className="w-3.5 h-3.5" /> Curate to Workspace
              </button>
              <Link
                to={`/compare/developers?user1=${encodeURIComponent(profile.login)}`}
                className="devhub-btn-subtle w-full py-1.5 border border-devhub-border text-center block"
              >
                <GitCompare className="w-3.5 h-3.5 inline mr-1" /> Benchmark Profile
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Column: Portfolio & Technical Footprint */}
        <main className="flex-1 w-full min-w-0">
          
          {/* Underline Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-devhub-border mb-4">
            <button
              onClick={() => setActiveTab('repos')}
              className={`devhub-tab ${activeTab === 'repos' ? 'devhub-tab-active' : ''}`}
            >
              <Code2 className="w-3.5 h-3.5" /> Repositories ({profile.repos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('footprint')}
              className={`devhub-tab ${activeTab === 'footprint' ? 'devhub-tab-active' : ''}`}
            >
              <Users className="w-3.5 h-3.5" /> Technical Footprint &amp; Languages
            </button>
          </div>

          {/* Tab 1: Repositories Portfolio */}
          {activeTab === 'repos' && (
            <div className="devhub-panel">
              <div className="devhub-panel-header">
                <span>Public Repository Portfolio</span>
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Filter author repos..."
                  className="devhub-input py-1 text-[11px] w-48"
                />
              </div>

              {filteredRepos.length > 0 ? (
                <div className="divide-y divide-devhub-borderMuted">
                  {filteredRepos.map((r) => (
                    <div key={r.full_name} className="p-3.5 hover:bg-devhub-surfaceHover transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/repo/${r.full_name}`}
                              className="text-xs font-semibold text-devhub-brand hover:underline truncate"
                            >
                              {r.name}
                            </Link>
                            <span className="devhub-mono-pill text-[10px]">Public</span>
                          </div>
                          {r.description && (
                            <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-1">
                              {r.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-devhub-textMuted font-mono">
                            {r.language && (
                              <span className="flex items-center gap-1 font-sans">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getLanguageColor(r.language) }}
                                />
                                <span className="text-devhub-textSecondary">{r.language}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-devhub-amber" />
                              {formatNumber(r.stargazers_count)}
                            </span>
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3 text-devhub-textMuted" />
                              {formatNumber(r.forks_count)}
                            </span>
                            {r.updated_at && (
                              <span className="font-sans">Updated {timeAgo(r.updated_at)}</span>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/repo/${r.full_name}`}
                          className="devhub-btn-default py-1 px-2 text-[11px] flex-shrink-0"
                        >
                          Inspect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-devhub-textMuted">
                  No repositories match your filter criteria.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Technical Footprint & Languages */}
          {activeTab === 'footprint' && (
            <div className="space-y-4">
              <div className="devhub-panel p-5">
                <div className="text-[11px] font-mono text-devhub-textMuted uppercase mb-3 font-semibold">
                  Language Distribution Footprint
                </div>
                
                {profile.top_languages && profile.top_languages.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-48 h-48 flex-shrink-0">
                      <Doughnut
                        data={langChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          cutout: '65%',
                        }}
                      />
                    </div>
                    <div className="flex-1 w-full divide-y divide-devhub-borderMuted">
                      {profile.top_languages.map((l) => (
                        <div key={l.language} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: getLanguageColor(l.language) }}
                            />
                            <span className="font-medium text-devhub-textPrimary">{l.language}</span>
                          </div>
                          <div className="font-mono text-xs text-devhub-textMuted">
                            {l.count} {l.count === 1 ? 'repository' : 'repositories'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-devhub-textMuted">No language telemetry recorded.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

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
                Curate @{profile.login} to Workspace
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
                  placeholder="Record developer competencies, interview notes, or project leads..."
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
                  placeholder="core-maintainer, rust-expert, hiring-candidate"
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