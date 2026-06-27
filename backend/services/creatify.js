// Thin client for Creatify's Product-to-Video API.
//
// Confirmed against Creatify's public API reference
// (https://docs.creatify.ai/api-reference/product_to_video) at the time this
// was written:
//   POST /api/product_to_videos/gen_image/        -> create a task, render a clean preview image
//   GET  /api/product_to_videos/{id}/             -> poll task status
//   POST /api/product_to_videos/{id}/gen_video/   -> render the first video for that task
//   POST /api/product_to_videos/{id}/regen_video/ -> render an alternate video; returns a NEW task id
//
// Auth: headers X-API-ID / X-API-KEY (never query params).
//
// TODO: verify field/enum names below (`type`, `aspect_ratio`, `status`
// values) against your live Creatify account before relying on this in
// production — Creatify has changed these before, and the docs site blocked
// automated fetches while this integration was written, so the values here
// come from Creatify's published curl examples rather than a live test call.

import axios from 'axios';

const BASE_URL = 'https://api.creatify.ai/api';

function client() {
  const apiId = process.env.CREATIFY_API_ID;
  const apiKey = process.env.CREATIFY_API_KEY;
  if (!apiId || !apiKey) {
    throw new Error(
      'Creatify API credentials are missing. Set CREATIFY_API_ID and CREATIFY_API_KEY in backend/.env',
    );
  }
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-ID': apiId,
      'X-API-KEY': apiKey,
    },
    timeout: 30_000,
  });
}

function unwrap(err, fallback) {
  const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
  const message = apiMessage || err.message || fallback;
  const wrapped = new Error(message);
  wrapped.cause = err;
  return wrapped;
}

/** Kick off a new product-to-video task from a public image URL. */
export async function genImage(productUrl) {
  try {
    const { data } = await client().post('/product_to_videos/gen_image/', {
      type: 'product_anyshot',
      product_url: productUrl,
      aspect_ratio: '9x16',
      image_prompt: 'elegant jewellery product shot, clean studio lighting, premium festive feel',
    });
    return data;
  } catch (err) {
    throw unwrap(err, 'Creatify rejected the product image.');
  }
}

/** Poll the current state of a product_to_videos task. */
export async function getTaskStatus(taskId) {
  try {
    const { data } = await client().get(`/product_to_videos/${taskId}/`);
    return data;
  } catch (err) {
    throw unwrap(err, `Could not fetch status for Creatify task ${taskId}.`);
  }
}

/** Render the first video once the preview image for a task is ready. */
export async function genVideo(taskId) {
  try {
    const { data } = await client().post(`/product_to_videos/${taskId}/gen_video/`, {});
    return data;
  } catch (err) {
    throw unwrap(err, 'Creatify could not start video rendering.');
  }
}

/**
 * Ask Creatify for an alternate take on the same product task. Per
 * Creatify's docs this returns a brand-new task id with its own status to
 * poll (it does not mutate the original task).
 */
export async function regenVideo(taskId) {
  try {
    const { data } = await client().post(`/product_to_videos/${taskId}/regen_video/`, {});
    return data;
  } catch (err) {
    throw unwrap(err, 'Creatify could not generate an alternate video.');
  }
}
