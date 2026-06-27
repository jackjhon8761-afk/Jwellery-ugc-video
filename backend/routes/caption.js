import express from 'express';
import { generateCaption } from '../services/openai.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  const { imageUrl, notes } = req.body || {};
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'imageUrl is required.' });
  }
  try {
    const caption = await generateCaption(imageUrl, notes);
    res.json({ caption });
  } catch (err) {
    console.error('Caption generation failed:', err);
    res.status(502).json({ error: err.message || 'Could not generate a caption right now. Please try again.' });
  }
});

export default router;
