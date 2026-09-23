import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import repoRoutes from './routes/repos.js';
import collectionRoutes from './routes/collections.js';
import systemRoutes from './routes/system.js';

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/system', systemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`DevHub server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
