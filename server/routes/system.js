import { Router } from 'express';
import { getRateLimit, getRateLimitInfo } from '../services/github.js';

const router = Router();

router.get('/rate-limit', async (req, res) => {
  try {
    const data = await getRateLimit();
    const info = getRateLimitInfo();
    const resetDate = new Date(info.reset * 1000);
    const timeUntilReset = Math.max(0, resetDate.getTime() - Date.now());
    res.json({
      limit: info.limit,
      remaining: info.remaining,
      used: info.used,
      reset: info.reset,
      reset_time: resetDate.toISOString(),
      time_until_reset_seconds: Math.ceil(timeUntilReset / 1000),
      is_token_auth: !!process.env.GITHUB_TOKEN,
    });
  } catch (err) {
    console.error('Rate limit error:', err);
    const info = getRateLimitInfo();
    res.json({
      limit: info.limit,
      remaining: info.remaining,
      used: info.used,
      reset: info.reset,
      is_token_auth: !!process.env.GITHUB_TOKEN,
    });
  }
});

export default router;
