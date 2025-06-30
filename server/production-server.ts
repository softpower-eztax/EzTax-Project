import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = parseInt(process.env.PORT) || 5000;

console.log('🌟 EzTax Production Server Starting');
console.log('   Environment:', NODE_ENV);
console.log('   Port:', PORT);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: NODE_ENV
  });
});

// API routes
app.get('/api/*', (req, res) => {
  res.json({ 
    message: 'EzTax API Server Running',
    endpoint: req.path,
    timestamp: new Date().toISOString()
  });
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>EzTax Production Server</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #2d3748; }
    .status { color: #38a169; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌟 EzTax Production Server</h1>
    <div class="status">✅ Server Running Successfully</div>
    <p>Port: ${PORT} | Environment: ${NODE_ENV}</p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <p><a href="/health">Health Check</a></p>
  </div>
</body>
</html>`);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server - bind to 0.0.0.0 for Replit deployment
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ EzTax Production Server started successfully');
  console.log('   URL: http://0.0.0.0:' + PORT);
  console.log('   Ready for deployment!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

// Prevent crash loops
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

export default app;
