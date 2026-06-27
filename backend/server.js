import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import uploadRouter from './routes/upload.js';
import videosRouter from './routes/videos.js';
import captionRouter from './routes/caption.js';
import instagramRouter from './routes/instagram.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/upload', uploadRouter);
app.use('/api/videos', videosRouter);
app.use('/api/caption', captionRouter);
app.use('/api/instagram', instagramRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Serve the built React app (frontend/dist) in production. Any GET request
// that isn't an API route or a static asset falls through to index.html so
// the wizard renders at "/" instead of Express's default "Cannot GET /".
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Centralized error handler — catches multer errors, bad JSON bodies, and
// anything thrown synchronously in a route, and always responds with the
// friendly { error } shape the frontend expects.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That file is too large.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Railway (and most container platforms) route traffic to the container on
// all interfaces, not just loopback — binding to 'localhost'/127.0.0.1 only
// makes the app unreachable from their edge proxy even though it "works"
// when curled from inside the container itself.
app.listen(PORT, HOST, () => {
  console.log(`Jewellery UGC Video Studio backend listening on http://${HOST}:${PORT}`);
});
