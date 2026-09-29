// server.ts - Connectly Full-Stack Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import connectDB, { seedMemoryStore } from './backend/config/db.js';
import authRoutes from './backend/routes/authRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import postRoutes from './backend/routes/postRoutes.js';
import commentRoutes from './backend/routes/commentRoutes.js';
import { notFound, errorHandler } from './backend/middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize Database (MongoDB or In-Memory)
  await connectDB();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  // Enable CORS
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Connectly API is online and fully operational',
      timestamp: new Date().toISOString()
    });
  });

  // Demo Reseed endpoint
  app.post('/api/seed', async (req, res) => {
    try {
      await seedMemoryStore();
      res.status(200).json({
        success: true,
        message: 'Demo dataset successfully reseeded! Users: alexrivera, sophiacodes, marcus_v, elenadesigns, david_k (default password: password123)'
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reseed database',
        error: err.message
      });
    }
  });

  // Mount REST API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);

  // Serve Frontend Static Files
  const frontendDir = path.resolve(__dirname, 'frontend');
  app.use(express.static(frontendDir));
  app.use('/frontend', express.static(frontendDir));

  // Explicit route mappings for multi-page vanilla frontend
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  app.get(['/login', '/login.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, 'login.html'));
  });

  app.get(['/register', '/register.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, 'register.html'));
  });

  app.get(['/profile', '/profile.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, 'profile.html'));
  });

  app.get(['/create-post', '/create-post.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, 'create-post.html'));
  });

  app.get(['/post', '/post.html'], (req, res) => {
    res.sendFile(path.join(frontendDir, 'post.html'));
  });

  // Create Vite Server in Middleware Mode for full-stack integration
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    },
    appType: 'custom'
  });

  app.use(vite.middlewares);

  // Fallback for SPA routing if not an API route
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return notFound(req, res, next);
    }
    res.sendFile(path.join(frontendDir, 'index.html'));
  });

  // Centralized Error Handling
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Connectly server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Connectly server:', err);
  process.exit(1);
});
