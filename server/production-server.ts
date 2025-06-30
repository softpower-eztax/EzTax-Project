import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Environment setup
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = parseInt(process.env.PORT) || 5000;

console.log('🌟 Starting EzTax Production Server');
console.log('   Environment:', NODE_ENV);
console.log('   Port:', PORT);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: NODE_ENV
  });
});

// API routes placeholder
app.get('/api/*', (req, res) => {
  res.json({ 
    message: 'EzTax API Server Running',
    endpoint: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all handler for frontend routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>EzTax - Production Server</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #2d3748; }
    .status { color: #38a169; font-weight: 600; margin: 20px 0; }
    .info { color: #4a5568; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌟 EzTax Production Server</h1>
    <div class="status">✅ Server Running Successfully</div>
    <div class="info">Port: ${PORT}</div>
    <div class="info">Environment: ${NODE_ENV}</div>
    <div class="info">Time: ${new Date().toLocaleString()}</div>
    <p><a href="/health">Health Check</a> | <a href="/api/status">API Status</a></p>
  </div>
</body>
</html>`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server with proper error handling to prevent crash loops
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ EzTax Production Server successfully started');
  console.log('   URL: http://0.0.0.0:' + PORT);
  console.log('   Health: http://0.0.0.0:' + PORT + '/health');
  console.log('   Ready for deployment!');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Uncaught exception handler to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
