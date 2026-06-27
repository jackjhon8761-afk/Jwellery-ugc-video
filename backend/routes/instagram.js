import express from 'express';
import { publishReel } from '../services/instagram.js';

const router = express.Router();

router.post('/publish', async (req, res) => {
  const { videoUrl, caption } = req.body || {};
  if (!videoUrl || !caption) {
    return res.status(400).json({ error: 'videoUrl and caption are required.' });
  }
  try {
    const mediaId = await publishReel(videoUrl, caption);
    res.json({ success: true, mediaId });
  } catch (err) {
    console.error('Instagram publish failed:', err);
    res.status(502).json({ success: false, error: err.message || 'Failed to publish to Instagram.' });
  }
});

export default router;
