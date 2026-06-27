// Thin client for publishing a Reel via the Instagram Graph API.
//
// Confirmed flow (https://developers.facebook.com/docs/instagram-platform/content-publishing):
//   1. POST /{ig-user-id}/media        media_type=REELS, video_url, caption  -> { id: containerId }
//   2. GET  /{container-id}?fields=status_code                              -> IN_PROGRESS | FINISHED | ERROR | EXPIRED
//   3. POST /{ig-user-id}/media_publish  creation_id=<containerId>          -> { id: publishedMediaId }
//
// Meta recommends polling step 2 about once a minute for up to ~5 minutes.
//
// TODO: verify endpoint paths, required params, and status_code values
// against the live docs before going to production — Meta's developer docs
// blocked automated fetches while this integration was written, and Graph
// API behavior can vary by app review status / permissions granted.

import axios from 'axios';

function config() {
  const accountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const version = process.env.GRAPH_API_VERSION || 'v21.0';
  if (!accountId || !accessToken) {
    throw new Error(
      'Instagram credentials are missing. Set IG_BUSINESS_ACCOUNT_ID and IG_ACCESS_TOKEN in backend/.env',
    );
  }
  return { accountId, accessToken, baseUrl: `https://graph.facebook.com/${version}` };
}

function unwrap(err, fallback) {
  const apiMessage = err?.response?.data?.error?.message;
  const wrapped = new Error(apiMessage || err.message || fallback);
  wrapped.cause = err;
  return wrapped;
}

async function createReelContainer(videoUrl, caption) {
  const { accountId, accessToken, baseUrl } = config();
  try {
    const { data } = await axios.post(`${baseUrl}/${accountId}/media`, null, {
      params: {
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
        share_to_feed: true,
        access_token: accessToken,
      },
      timeout: 30_000,
    });
    return data.id;
  } catch (err) {
    throw unwrap(err, 'Instagram rejected the video container.');
  }
}

async function getContainerStatus(containerId) {
  const { accessToken, baseUrl } = config();
  try {
    const { data } = await axios.get(`${baseUrl}/${containerId}`, {
      params: { fields: 'status_code', access_token: accessToken },
      timeout: 15_000,
    });
    return data.status_code;
  } catch (err) {
    throw unwrap(err, 'Could not check Instagram processing status.');
  }
}

async function publishContainer(creationId) {
  const { accountId, accessToken, baseUrl } = config();
  try {
    const { data } = await axios.post(`${baseUrl}/${accountId}/media_publish`, null, {
      params: { creation_id: creationId, access_token: accessToken },
      timeout: 30_000,
    });
    return data.id;
  } catch (err) {
    throw unwrap(err, 'Instagram could not publish the Reel.');
  }
}

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Full publish flow: create container, wait for processing, publish. */
export async function publishReel(videoUrl, caption) {
  const containerId = await createReelContainer(videoUrl, caption);

  const startedAt = Date.now();
  for (;;) {
    const status = await getContainerStatus(containerId);
    if (status === 'FINISHED') break;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Instagram could not process the video (status: ${status}).`);
    }
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      throw new Error('Timed out waiting for Instagram to finish processing the video.');
    }
    await sleep(POLL_INTERVAL_MS);
  }

  return publishContainer(containerId);
}
