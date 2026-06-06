import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import apiRouter from './routes/api';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for the sake of the assignment deployment (simplifies EC2 deployment)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json());

// AWS Load Balancer Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'BTEC Cloud Networking API'
  });
});

// Register API Routes
app.use('/api', apiRouter);

// Serve static files from the React frontend build if present
import path from 'path';
import fs from 'fs';
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
  console.log(`Serving React frontend statically from: ${frontendDistPath}`);
} else {
  console.log('Frontend build not found; running in API-only mode.');
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 BTEC Cloud Networking Backend Server running!`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
  console.log(`===================================================`);
});
