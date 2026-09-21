import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark, Users, Star, GitFork, Tag, Trash2, Edit3, Search, X,
  ExternalLink, Loader2, Code2, Terminal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatNumber, getLanguageColor, timeAgo } from '../utils/languages';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('repos');
  const [repos, setRepos] = useState([]);
  const [devs, setDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ notes: '', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reposRes, devsRes] = await Promise.allSettled([
        api.get('/collections/repos'),
        api.get('/collections/developers'),
      ]);
      if (reposRes.status === 'fulfilled') setRepos(reposRes.value.data.repos || []);
      if (devsRes.status === 'fulfilled') setDevs(devsRes.value.data.developers || []);
    } catch (err) {
      toast.error('Failed to load collections workspace');
    } finally {
      setLoading(false);
    }
  };

  const allTags = [...new Set([
    ...repos.flatMap((r) => r.tags || []),
    ...devs.flatMap((d) => d.tags || []),
  ])].filter(Boolean);

  const filteredRepos = repos.filter((r) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      if (
        !r.repo_full_name.toLowerCase().includes(q) &&
        !(r.description || '').toLowerCase().includes(q) &&
        !(r.notes || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (tagFilter && !(r.tags || []).includes(tagFilter)) return false;
    return true;
  });

  const filteredDevs = devs.filter((d) => {
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      if (
        !d.github_username.toLowerCase().includes(q) &&
        !(d.github_name || '').toLowerCase().includes(q) &&
        !(d.notes || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (tagFilter && !(d.tags || []).includes(tagFilter)) return false;
    return true;
  });

  const handleDeleteRepo = async (fullName) => {
    try {
      await api.delete(`/collections/repos/${fullName}`);
      setRepos((prev) => prev.filter((r) => r.repo_full_name !== fullName));
      toast.success('Repository removed from workspace');
    } catch (err) {
      toast.error('Failed to remove repository');
    }
  };

  const handleDeleteDev = async (username) => {
    try {
      await api.delete(`/collections/developers/${username}`);
      setDevs((prev) => prev.filter((d) => d.github_username !== username));
      toast.success('Developer removed from workspace');
    } catch (err) {
      toast.error('Failed to remove developer');
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const parsedTags = editForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (editingItem.type === 'repo') {
        await api.put(`/collections/repos/${editingItem.repo_full_name}`, {
          notes: editForm.notes,
          tags: parsedTags,
        });
        setRepos((prev) =>
          prev.map((r) =>
            r.repo_full_name === editingItem.repo_full_name
              ? { ...r, notes: editForm.notes, tags: parsedTags }
              : r
          )
        );
      } else {
        await api.put(`/collections/developers/${editingItem.github_username}`, {
          notes: editForm.notes,
          tags: parsedTags,
        });
        setDevs((prev) =>
          prev.map((d) =>
            d.github_username === editingItem.github_username
              ? { ...d, notes: editForm.notes, tags: parsedTags }
              : d
          )
        );
      }
      toast.success('Workspace item updated.');
      setEditingItem(null);
    } catch (err) {
      toast.error('Failed to update workspace entry');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Workspace Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-devhub-brand font-semibold uppercase">
            <Bookmark className="w-3.5 h-3.5" /> Personal Research Workspace
          </div>
          <h1 className="text-xl font-bold text-devhub-textPrimary mt-1">
            Curated Collections &amp; Notes
          </h1>
          <p className="text-xs text-devhub-textMuted mt-0.5">
            Manage your curated repositories, tracked engineering leads, and technical evaluation notes.
          </p>
        </div>

        {/* Telemetry Numbers */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="devhub-panel-inset px-3 py-1.5 text-center">
            <span className="text-[10px] text-devhub-textMuted block">REPOSITORIES</span>
            <span className="text-sm font-bold text-devhub-textPrimary">{repos.length}</span>
          </div>
          <div className="devhub-panel-inset px-3 py-1.5 text-center">
            <span className="text-[10px] text-devhub-textMuted block">DEVELOPERS</span>
            <span className="text-sm font-bold text-devhub-brand">{devs.length}</span>
          </div>
          <div className="devhub-panel-inset px-3 py-1.5 text-center">
            <span className="text-[10px] text-devhub-textMuted block">TAGS</span>
            <span className="text-sm font-bold text-devhub-purple">{allTags.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="devhub-panel p-3 mb-6 flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search saved items by title, notes, or descriptions..."
            className="devhub-input pl-8 w-full text-xs focus:border-orange-600 focus:ring-orange-600/30"
          />
        </div>

        {allTags.length > 0 && (
          <div className="w-full sm:w-auto">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="devhub-select w-full sm:w-44 text-xs"
            >
              <option value="">All Research Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Category Underline Tabs */}
      <div className="flex items-center gap-1 border-b border-devhub-border mb-4">
        <button
          onClick={() => setActiveTab('repos')}
          className={`devhub-tab ${activeTab === 'repos' ? 'devhub-tab-active' : ''}`}
        >
          <Code2 className="w-3.5 h-3.5" /> Curated Repositories ({filteredRepos.length})
        </button>
        <button
          onClick={() => setActiveTab('devs')}
          className={`devhub-tab ${activeTab === 'devs' ? 'devhub-tab-active' : ''}`}
        >
          <Users className="w-3.5 h-3.5" /> Curated Developers ({filteredDevs.length})
        </button>
      </div>

      {/* Main Collections Stream */}
      <div className="devhub-panel">
        <div className="devhub-panel-header">
          <span>{activeTab === 'repos' ? 'Tracked Repositories' : 'Tracked Engineers'}</span>
          <span className="font-mono text-[10px] text-devhub-textMuted">
            {activeTab === 'repos' ? `${filteredRepos.length} ITEMS` : `${filteredDevs.length} PROFILES`}
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="devhub-skeleton h-14" />
            ))}
          </div>
        ) : activeTab === 'repos' ? (
          filteredRepos.length === 0 ? (
            <div className="p-12 text-center text-xs text-devhub-textMuted">
              <Bookmark className="w-8 h-8 text-devhub-border mx-auto mb-2" />
              <p className="font-medium text-devhub-textPrimary">No repositories in workspace</p>
              <p className="text-[11px] mt-0.5">
                Search open-source repositories and click "Save to Workspace" to curate entries here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-devhub-borderMuted">
              {filteredRepos.map((r) => (
                <div key={r.repo_full_name} className="p-4 hover:bg-devhub-surfaceHover transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/repo/${r.repo_full_name}`}
                          className="text-sm font-semibold text-devhub-brand hover:underline truncate"
                        >
                          {r.repo_full_name}
                        </Link>
                        {r.language && (
                          <span className="flex items-center gap-1 text-[11px] text-devhub-textMuted font-mono ml-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getLanguageColor(r.language) }}
                            />
                            {r.language}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs text-devhub-textSecondary mt-1 line-clamp-1">
                          {r.description}
                        </p>
                      )}

                      {/* Notes & Tags Block */}
                      {(r.notes || (r.tags && r.tags.length > 0)) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          {r.notes && (
                            <span className="text-[11px] text-devhub-textMuted italic bg-devhub-subtle px-2 py-0.5 rounded border border-devhub-borderMuted">
                              Note: "{r.notes}"
                            </span>
                          )}
                          {(r.tags || []).map((t) => (
                            <span key={t} className="devhub-tag text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-devhub-textMuted">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-devhub-amber" />
                          {formatNumber(r.stars)}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3 text-devhub-textMuted" />
                          {formatNumber(r.forks)}
                        </span>
                        <span>Saved {timeAgo(r.created_at)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingItem({ type: 'repo', repo_full_name: r.repo_full_name });
                          setEditForm({ notes: r.notes || '', tags: (r.tags || []).join(', ') });
                        }}
                        className="devhub-btn-default py-1 px-2 text-[11px]"
                        title="Edit Notes & Tags"
                      >
                        <Edit3 className="w-3 h-3" /> Annotate
                      </button>
                      <button
                        onClick={() => handleDeleteRepo(r.repo_full_name)}
                        className="devhub-btn-subtle p-1.5 text-devhub-textMuted hover:text-red-400"
                        title="Remove from Workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredDevs.length === 0 ? (
          <div className="p-12 text-center text-xs text-devhub-textMuted">
            <Users className="w-8 h-8 text-devhub-border mx-auto mb-2" />
            <p className="font-medium text-devhub-textPrimary">No developers in workspace</p>
            <p className="text-[11px] mt-0.5">
              Explore engineer profiles and click "Curate to Workspace" to track technical contacts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-devhub-borderMuted">
            {filteredDevs.map((d) => (
              <div key={d.github_username} className="p-4 hover:bg-devhub-surfaceHover transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={d.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full border border-devhub-border flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/user/${d.github_username}`}
                          className="text-sm font-semibold text-devhub-brand hover:underline truncate"
                        >
                          @{d.github_username}
                        </Link>
                        {d.github_name && (
                          <span className="text-xs text-devhub-textMuted">({d.github_name})</span>
                        )}
                      </div>

                      {d.bio && (
                        <p className="text-xs text-devhub-textSecondary mt-0.5 line-clamp-1">
                          {d.bio}
                        </p>
                      )}

                      {/* Notes & Tags Block */}
                      {(d.notes || (d.tags && d.tags.length > 0)) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          {d.notes && (
                            <span className="text-[11px] text-devhub-textMuted italic bg-devhub-subtle px-2 py-0.5 rounded border border-devhub-borderMuted">
                              Note: "{d.notes}"
                            </span>
                          )}
                          {(d.tags || []).map((t) => (
                            <span key={t} className="devhub-tag text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingItem({ type: 'dev', github_username: d.github_username });
                        setEditForm({ notes: d.notes || '', tags: (d.tags || []).join(', ') });
                      }}
                      className="devhub-btn-default py-1 px-2 text-[11px]"
                      title="Edit Notes & Tags"
                    >
                      <Edit3 className="w-3 h-3" /> Annotate
                    </button>
                    <button
                      onClick={() => handleDeleteDev(d.github_username)}
                      className="devhub-btn-subtle p-1.5 text-devhub-textMuted hover:text-red-400"
                      title="Remove from Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Annotations Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="devhub-panel w-full max-w-md p-5 bg-devhub-surface border border-devhub-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-devhub-borderMuted mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-devhub-textPrimary font-mono">
                Update Research Annotation ({editingItem.type === 'repo' ? editingItem.repo_full_name : `@${editingItem.github_username}`})
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="devhub-btn-subtle p-1 text-devhub-textMuted"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">NOTES</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Record architectural impressions, evaluation scores..."
                  className="devhub-input w-full h-20 resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-devhub-textMuted block mb-1">
                  TAGS (COMMA-SEPARATED)
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="e.g. backend, evaluate-soon, core-team"
                  className="devhub-input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-devhub-borderMuted">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="devhub-btn-default"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="devhub-btn-primary"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Annotation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
