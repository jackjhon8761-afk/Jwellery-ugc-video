// Generates one Instagram caption for the chosen jewellery video using
// OpenAI's gpt-4o-mini. We pass the original ornament photo as a vision
// input so the caption can reference the actual piece (gold tone, style,
// stones, etc.) rather than being completely generic.

import OpenAI from 'openai';

let client;
function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is missing. Set it in backend/.env');
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const SYSTEM_PROMPT = `You write Instagram captions for an Indian jewellery showroom's UGC-style video ads.

Tone: elegant, warm, festive — like a trusted local jeweller speaking to a customer, never salesy or robotic.

Format strictly:
- 2-3 short lines of caption copy (no more). Each line should breathe; avoid run-on sentences.
- A blank line, then 12-15 relevant hashtags on a single line, space-separated.
- Hashtags must mix: jewellery/gold terms, wedding/bridal terms, Indian festive occasion terms (e.g. Diwali, Akshaya Tritiya, festive season — pick what fits), and 2-3 local-discovery tags (e.g. #ShopLocal #JewelleryShowroom #VisitUs style tags that help nearby customers find a physical store). Do not invent a specific city/place name.
- Use at most 1-2 tasteful emojis total, only in the caption lines, never in the hashtags.
- Output ONLY the caption and hashtags. No preamble, no quotation marks, no explanations.`;

export async function generateCaption(imageUrl, notes = '') {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 300,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: notes
              ? `Write the caption for this ornament. Extra context from the showroom owner: ${notes}`
              : 'Write the caption for this ornament.',
          },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
  });

  const caption = response.choices?.[0]?.message?.content?.trim();
  if (!caption) {
    throw new Error('OpenAI returned an empty caption.');
  }
  return caption;
}
