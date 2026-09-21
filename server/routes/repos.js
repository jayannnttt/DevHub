import { Router } from 'express';
import {
  searchRepos, getRepo, getRepoLanguages,
  getRepoContributors, getRepoCommits, getRepoReleases,
  getRateLimitInfo, setClientToken
} from '../services/github.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, sort = 'stars', order = 'desc', language = '', min_stars = 0 } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const data = await searchRepos(q.trim(), {
      page: parseInt(page), sort, order,
      language, minStars: parseInt(min_stars) || 0
    });
    res.json({
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: (data.items || []).map(r => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        language: r.language,
        html_url: r.html_url,
        updated_at: r.updated_at,
        topics: r.topics,
        owner: { login: r.owner.login, avatar_url: r.owner.avatar_url },
      })),
      _cache: data._cache,
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        return res.status(429).json({ error: 'GitHub API rate limit exceeded.', rateLimit: getRateLimitInfo() });
      }
      return res.status(status).json({ error: err.response.data?.message || 'GitHub API error' });
    }
    console.error('Repo search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/compare', async (req, res) => {
  try {
    const { repo1, repo2 } = req.query;
    if (!repo1 || !repo2) {
      return res.status(400).json({ error: 'Both repo1 and repo2 (owner/name) are required' });
    }
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const [r1Parts, r2Parts] = [repo1.trim().split('/'), repo2.trim().split('/')];
    if (r1Parts.length !== 2 || r2Parts.length !== 2) {
      return res.status(400).json({ error: 'Repository format must be owner/name' });
    }
    const [data1, data2] = await Promise.allSettled([
      getRepo(r1Parts[0], r1Parts[1]),
      getRepo(r2Parts[0], r2Parts[1]),
    ]);
    const errors = [];
    if (data1.status === 'rejected') errors.push(`Repository '${repo1}' not found`);
    if (data2.status === 'rejected') errors.push(`Repository '${repo2}' not found`);
    if (errors.length > 0) {
      return res.status(404).json({ error: errors.join('; ') });
    }
    const [langs1, langs2] = await Promise.allSettled([
      getRepoLanguages(r1Parts[0], r1Parts[1]),
      getRepoLanguages(r2Parts[0], r2Parts[1]),
    ]);
    const calcScore = (repo) => {
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;
      const watchers = repo.watchers_count || 0;
      return Math.round((stars * 0.4) + (forks * 0.3) + (watchers * 0.2));
    };
    const formatRepo = (r, langs) => ({
      full_name: r.full_name,
      description: r.description,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      watchers_count: r.watchers_count,
      open_issues_count: r.open_issues_count,
      language: r.language,
      license: r.license?.name || null,
      size: r.size,
      created_at: r.created_at,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      html_url: r.html_url,
      topics: r.topics,
      languages: langs.status === 'fulfilled' ? langs.value : {},
      activity_score: calcScore(r),
    });
    res.json({
      repo1: formatRepo(data1.value, langs1),
      repo2: formatRepo(data2.value, langs2),
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error('Repo compare error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const [repoData, langsData] = await Promise.allSettled([
      getRepo(owner, repo),
      getRepoLanguages(owner, repo),
    ]);
    if (repoData.status === 'rejected') {
      return res.status(404).json({ error: `Repository '${owner}/${repo}' not found` });
    }
    const r = repoData.value;
    const languages = langsData.status === 'fulfilled' ? langsData.value : {};
    const totalBytes = Object.values(languages).reduce((s, v) => s + v, 0);
    const languageBreakdown = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    res.json({
      full_name: r.full_name,
      name: r.name,
      owner: { login: r.owner.login, avatar_url: r.owner.avatar_url, html_url: r.owner.html_url },
      description: r.description,
      html_url: r.html_url,
      homepage: r.homepage,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      watchers_count: r.watchers_count,
      open_issues_count: r.open_issues_count,
      language: r.language,
      license: r.license?.name || null,
      default_branch: r.default_branch,
      size: r.size,
      created_at: r.created_at,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      topics: r.topics,
      visibility: r.visibility,
      languages: languageBreakdown,
      total_language_bytes: totalBytes,
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: `Repository '${req.params.owner}/${req.params.repo}' not found` });
    }
    console.error('Repo details error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:owner/:repo/contributors', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const data = await getRepoContributors(owner, repo);
    const contributors = Array.isArray(data) ? data : [];
    res.json({
      contributors: contributors.map(c => ({
        login: c.login,
        avatar_url: c.avatar_url,
        contributions: c.contributions,
        html_url: c.html_url,
        type: c.type,
      })),
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    console.error('Contributors error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:owner/:repo/activity', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const [commits, releases] = await Promise.allSettled([
      getRepoCommits(owner, repo),
      getRepoReleases(owner, repo),
    ]);
    const commitList = commits.status === 'fulfilled' ? (Array.isArray(commits.value) ? commits.value : []) : [];
    const releaseList = releases.status === 'fulfilled' ? (Array.isArray(releases.value) ? releases.value : []) : [];
    res.json({
      recent_commits: commitList.slice(0, 15).map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author_name: c.commit.author?.name || 'Unknown',
        author_date: c.commit.author?.date,
        author_avatar: c.author?.avatar_url || null,
        html_url: c.html_url,
      })),
      latest_release: releaseList.length > 0 ? {
        tag_name: releaseList[0].tag_name,
        name: releaseList[0].name,
        published_at: releaseList[0].published_at,
        html_url: releaseList[0].html_url,
      } : null,
      total_commits_displayed: commitList.length,
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error('Activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
