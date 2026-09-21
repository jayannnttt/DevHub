import axios from 'axios';
import { getOne, runQuery, getAll } from '../db/database.js';

const GITHUB_API = 'https://api.github.com';
const CACHE_TTL = {
  search: 15 * 60 * 1000,
  profile: 30 * 60 * 1000,
  repo: 30 * 60 * 1000,
  languages: 30 * 60 * 1000,
  contributors: 15 * 60 * 1000,
  activity: 15 * 60 * 1000,
};

let rateLimitInfo = {
  limit: 60,
  remaining: 60,
  reset: 0,
  used: 0,
};

const githubAxios = axios.create({
  baseURL: GITHUB_API,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevHub-Analytics-Platform',
  },
  timeout: 15000,
});

function getHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    return { Authorization: `token ${token}` };
  }
  return {};
}

function setClientToken(token) {
  if (token) {
    githubAxios.defaults.headers.common['Authorization'] = `token ${token}`;
  } else {
    delete githubAxios.defaults.headers.common['Authorization'];
  }
}

function updateRateLimit(headers) {
  if (headers['x-ratelimit-limit']) {
    rateLimitInfo.limit = parseInt(headers['x-ratelimit-limit']);
  }
  if (headers['x-ratelimit-remaining']) {
    rateLimitInfo.remaining = parseInt(headers['x-ratelimit-remaining']);
  }
  if (headers['x-ratelimit-reset']) {
    rateLimitInfo.reset = parseInt(headers['x-ratelimit-reset']);
  }
  if (headers['x-ratelimit-used']) {
    rateLimitInfo.used = parseInt(headers['x-ratelimit-used']);
  }
}

function getCached(key) {
  const row = getOne('SELECT data, expires_at FROM api_cache WHERE cache_key = ?', [key]);
  if (row && row.expires_at > Date.now()) {
    return { data: JSON.parse(row.data), hit: true };
  }
  if (row) {
    runQuery('DELETE FROM api_cache WHERE cache_key = ?', [key]);
  }
  return null;
}

function setCache(key, data, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  try {
    runQuery('INSERT OR REPLACE INTO api_cache (cache_key, data, expires_at) VALUES (?, ?, ?)', [
      key, JSON.stringify(data), expiresAt
    ]);
  } catch (e) {
    // cache write failure is non-critical
  }
}

async function githubRequest(endpoint, cacheTtl = CACHE_TTL.search, params = {}) {
  const cacheKey = `github:${endpoint}:${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { ...cached.data, _cache: 'HIT' };
  }
  try {
    const response = await githubAxios.get(endpoint, { params, headers: getHeaders() });
    updateRateLimit(response.headers);
    const result = { ...response.data, _cache: 'MISS', _rateLimit: { ...rateLimitInfo } };
    setCache(cacheKey, result, cacheTtl);
    return result;
  } catch (err) {
    if (err.response && err.response.headers) {
      updateRateLimit(err.response.headers);
    }
    throw err;
  }
}

async function searchUsers(query, { page = 1, sort = '', order = 'desc' } = {}) {
  const params = { q: query, per_page: 20, page };
  if (sort) { params.sort = sort; params.order = order; }
  return githubRequest('/search/users', CACHE_TTL.search, params);
}

async function searchRepos(query, { page = 1, sort = 'stars', order = 'desc', language = '', minStars = 0 } = {}) {
  let q = query;
  if (language) q += ` language:${language}`;
  if (minStars) q += ` stars:>=${minStars}`;
  const params = { q, per_page: 20, page };
  if (sort) { params.sort = sort; params.order = order; }
  return githubRequest('/search/repositories', CACHE_TTL.search, params);
}

async function getUser(username) {
  return githubRequest(`/users/${username}`, CACHE_TTL.profile);
}

async function getUserRepos(username, { page = 1, perPage = 30, sort = 'updated' } = {}) {
  return githubRequest(`/users/${username}/repos`, CACHE_TTL.profile, {
    per_page: perPage, page, sort, direction: 'desc'
  });
}

async function getRepo(owner, repo) {
  return githubRequest(`/repos/${owner}/${repo}`, CACHE_TTL.repo);
}

async function getRepoLanguages(owner, repo) {
  return githubRequest(`/repos/${owner}/${repo}/languages`, CACHE_TTL.languages);
}

async function getRepoContributors(owner, repo, { page = 1, perPage = 30 } = {}) {
  return githubRequest(`/repos/${owner}/${repo}/contributors`, CACHE_TTL.contributors, {
    per_page: perPage, page
  });
}

async function getRepoCommits(owner, repo, { page = 1, perPage = 30 } = {}) {
  return githubRequest(`/repos/${owner}/${repo}/commits`, CACHE_TTL.activity, {
    per_page: perPage, page
  });
}

async function getRepoReleases(owner, repo, { page = 1, perPage = 5 } = {}) {
  try {
    return await githubRequest(`/repos/${owner}/${repo}/releases`, CACHE_TTL.activity, {
      per_page: perPage, page
    });
  } catch (err) {
    return [];
  }
}

async function getRateLimit() {
  try {
    const headers = getHeaders();
    const response = await githubAxios.get('/rate_limit', { headers });
    updateRateLimit(response.headers);
    return response.data;
  } catch (err) {
    return { rateLimit: rateLimitInfo };
  }
}

function getRateLimitInfo() {
  return { ...rateLimitInfo };
}

export {
  searchUsers, searchRepos, getUser, getUserRepos,
  getRepo, getRepoLanguages, getRepoContributors,
  getRepoCommits, getRepoReleases, getRateLimit,
  getRateLimitInfo, setClientToken, githubRequest
};
