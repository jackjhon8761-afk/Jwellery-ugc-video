import express from 'express';
import axios from 'axios';
import { startVideoJob, getJob } from '../services/videoPipeline.js';

const router = express.Router();

router.post('/generate', (req, res) => {
  const { imageUrl } = req.body || {};
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'imageUrl is required.' });
  }
  try {
    const jobId = startVideoJob(imageUrl);
    res.status(202).json({ jobId });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to start video generation.' });
  }
});

router.get('/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found. It may have expired — please try generating again.' });
  }
  res.json(job);
});

// Streams a Creatify-hosted video back through our own origin so the browser
// can save it with a clean filename instead of fighting cross-origin
// download restrictions on third-party CDN links.
router.get('/download', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url query parameter is required.' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'url is not a valid URL.' });
  }
  if (parsed.protocol !== 'https:') {
    return res.status(400).json({ error: 'Only https video URLs can be downloaded.' });
  }

  try {
    const upstream = await axios.get(url, { responseType: 'stream', timeout: 60_000 });
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="jewellery-ad.mp4"');
    upstream.data.pipe(res);
  } catch (err) {
    res.status(502).json({ error: 'Could not download the video. Please try again.' });
  }
});

export default router;
