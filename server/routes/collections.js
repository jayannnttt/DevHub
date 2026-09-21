import { Router } from 'express';
import { runQuery, getOne, getAll } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Developer collections
router.get('/developers', (req, res) => {
  try {
    const { tag, q } = req.query;
    let rows = getAll('SELECT * FROM favorite_developers WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    if (tag) {
      rows = rows.filter(r => {
        try { return JSON.parse(r.tags || '[]').includes(tag); } catch { return false; }
      });
    }
    if (q) {
      const lower = q.toLowerCase();
      rows = rows.filter(r =>
        r.github_username.toLowerCase().includes(lower) ||
        (r.github_name && r.github_name.toLowerCase().includes(lower)) ||
        (r.notes && r.notes.toLowerCase().includes(lower))
      );
    }
    res.json({ developers: rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })) });
  } catch (err) {
    console.error('Get dev collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/developers', (req, res) => {
  try {
    const { github_username, github_name, avatar_url, bio, notes = '', tags = [] } = req.body;
    if (!github_username) {
      return res.status(400).json({ error: 'github_username is required' });
    }
    const existing = getOne('SELECT id FROM favorite_developers WHERE user_id = ? AND github_username = ?', [req.user.id, github_username]);
    if (existing) {
      return res.status(409).json({ error: 'Developer already in favorites' });
    }
    const result = runQuery(
      'INSERT INTO favorite_developers (user_id, github_username, github_name, avatar_url, bio, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, github_username, github_name || '', avatar_url || '', bio || '', notes, JSON.stringify(tags)]
    );
    const dev = getOne('SELECT * FROM favorite_developers WHERE id = ?', [result.lastID]);
    res.status(201).json({ developer: { ...dev, tags: JSON.parse(dev.tags || '[]') } });
  } catch (err) {
    console.error('Add dev collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/developers/:username', (req, res) => {
  try {
    const { username } = req.params;
    const { notes, tags } = req.body;
    const dev = getOne('SELECT * FROM favorite_developers WHERE user_id = ? AND github_username = ?', [req.user.id, username]);
    if (!dev) {
      return res.status(404).json({ error: 'Developer not found in favorites' });
    }
    runQuery(
      'UPDATE favorite_developers SET notes = ?, tags = ? WHERE user_id = ? AND github_username = ?',
      [notes !== undefined ? notes : dev.notes, JSON.stringify(tags !== undefined ? tags : JSON.parse(dev.tags || '[]')), req.user.id, username]
    );
    const updated = getOne('SELECT * FROM favorite_developers WHERE user_id = ? AND github_username = ?', [req.user.id, username]);
    res.json({ developer: { ...updated, tags: JSON.parse(updated.tags || '[]') } });
  } catch (err) {
    console.error('Update dev collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/developers/:username', (req, res) => {
  try {
    const { username } = req.params;
    const dev = getOne('SELECT id FROM favorite_developers WHERE user_id = ? AND github_username = ?', [req.user.id, username]);
    if (!dev) {
      return res.status(404).json({ error: 'Developer not found in favorites' });
    }
    runQuery('DELETE FROM favorite_developers WHERE user_id = ? AND github_username = ?', [req.user.id, username]);
    res.json({ message: 'Developer removed from favorites' });
  } catch (err) {
    console.error('Delete dev collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Repository collections
router.get('/repos', (req, res) => {
  try {
    const { tag, q } = req.query;
    let rows = getAll('SELECT * FROM favorite_repos WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    if (tag) {
      rows = rows.filter(r => {
        try { return JSON.parse(r.tags || '[]').includes(tag); } catch { return false; }
      });
    }
    if (q) {
      const lower = q.toLowerCase();
      rows = rows.filter(r =>
        r.repo_full_name.toLowerCase().includes(lower) ||
        (r.description && r.description.toLowerCase().includes(lower)) ||
        (r.notes && r.notes.toLowerCase().includes(lower))
      );
    }
    res.json({ repos: rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })) });
  } catch (err) {
    console.error('Get repo collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/repos', (req, res) => {
  try {
    const { repo_full_name, description, stars = 0, forks = 0, language, notes = '', tags = [] } = req.body;
    if (!repo_full_name) {
      return res.status(400).json({ error: 'repo_full_name is required' });
    }
    const existing = getOne('SELECT id FROM favorite_repos WHERE user_id = ? AND repo_full_name = ?', [req.user.id, repo_full_name]);
    if (existing) {
      return res.status(409).json({ error: 'Repository already in favorites' });
    }
    const result = runQuery(
      'INSERT INTO favorite_repos (user_id, repo_full_name, description, stars, forks, language, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, repo_full_name, description || '', stars, forks, language || '', notes, JSON.stringify(tags)]
    );
    const repo = getOne('SELECT * FROM favorite_repos WHERE id = ?', [result.lastID]);
    res.status(201).json({ repo: { ...repo, tags: JSON.parse(repo.tags || '[]') } });
  } catch (err) {
    console.error('Add repo collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/repos/:owner/:repo', (req, res) => {
  try {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;
    const { notes, tags } = req.body;
    const r = getOne('SELECT * FROM favorite_repos WHERE user_id = ? AND repo_full_name = ?', [req.user.id, fullName]);
    if (!r) {
      return res.status(404).json({ error: 'Repository not found in favorites' });
    }
    runQuery(
      'UPDATE favorite_repos SET notes = ?, tags = ? WHERE user_id = ? AND repo_full_name = ?',
      [notes !== undefined ? notes : r.notes, JSON.stringify(tags !== undefined ? tags : JSON.parse(r.tags || '[]')), req.user.id, fullName]
    );
    const updated = getOne('SELECT * FROM favorite_repos WHERE user_id = ? AND repo_full_name = ?', [req.user.id, fullName]);
    res.json({ repo: { ...updated, tags: JSON.parse(updated.tags || '[]') } });
  } catch (err) {
    console.error('Update repo collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/repos/:owner/:repo', (req, res) => {
  try {
    const { owner, repo } = req.params;
    const fullName = `${owner}/${repo}`;
    const r = getOne('SELECT id FROM favorite_repos WHERE user_id = ? AND repo_full_name = ?', [req.user.id, fullName]);
    if (!r) {
      return res.status(404).json({ error: 'Repository not found in favorites' });
    }
    runQuery('DELETE FROM favorite_repos WHERE user_id = ? AND repo_full_name = ?', [req.user.id, fullName]);
    res.json({ message: 'Repository removed from favorites' });
  } catch (err) {
    console.error('Delete repo collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
