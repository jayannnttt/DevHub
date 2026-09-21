import { Router } from 'express';
import { searchUsers, getUser, getUserRepos, getRepoLanguages, getRateLimitInfo, setClientToken } from '../services/github.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, sort = '', order = 'desc' } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const data = await searchUsers(q.trim(), { page: parseInt(page), sort, order });
    res.json({
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: (data.items || []).map(u => ({
        login: u.login,
        avatar_url: u.avatar_url,
        type: u.type,
        score: u.score,
      })),
      _cache: data._cache,
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        return res.status(429).json({ error: 'GitHub API rate limit exceeded. Try again later or add a GitHub token.', rateLimit: getRateLimitInfo() });
      }
      return res.status(status).json({ error: err.response.data?.message || 'GitHub API error' });
    }
    console.error('User search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/compare', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both user1 and user2 parameters are required' });
    }
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const [data1, data2] = await Promise.allSettled([
      getUser(user1.trim()),
      getUser(user2.trim()),
    ]);
    const errors = [];
    if (data1.status === 'rejected') errors.push(`User '${user1}' not found`);
    if (data2.status === 'rejected') errors.push(`User '${user2}' not found`);
    if (errors.length > 0) {
      return res.status(404).json({ error: errors.join('; ') });
    }
    const formatUser = (u) => ({
      login: u.login,
      name: u.name,
      avatar_url: u.avatar_url,
      bio: u.bio,
      public_repos: u.public_repos,
      public_gists: u.public_gists,
      followers: u.followers,
      following: u.following,
      created_at: u.created_at,
      company: u.company,
      location: u.location,
    });
    res.json({
      user1: formatUser(data1.value),
      user2: formatUser(data2.value),
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error('User compare error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (req.headers['x-github-token']) {
      setClientToken(req.headers['x-github-token']);
    }
    const [userData, reposData] = await Promise.allSettled([
      getUser(username),
      getUserRepos(username),
    ]);
    if (userData.status === 'rejected') {
      return res.status(404).json({ error: `User '${username}' not found` });
    }
    const user = userData.value;
    const repos = reposData.status === 'fulfilled' ? reposData.value : [];

    let totalStars = 0;
    let totalForks = 0;
    const langCounts = {};
    const repoList = Array.isArray(repos) ? repos : [];
    for (const repo of repoList) {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    }
    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([lang, count]) => ({ language: lang, count }));

    res.json({
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      twitter_username: user.twitter_username,
      email: user.email,
      created_at: user.created_at,
      public_repos: user.public_repos,
      public_gists: user.public_gists,
      followers: user.followers,
      following: user.following,
      total_stars: totalStars,
      total_forks: totalForks,
      top_languages: topLanguages,
      repos: repoList.map(r => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        language: r.language,
        html_url: r.html_url,
        updated_at: r.updated_at,
        topics: r.topics,
      })),
      _rateLimit: getRateLimitInfo(),
    });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
