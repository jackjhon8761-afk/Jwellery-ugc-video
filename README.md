# Jewellery UGC Video Studio

An internal tool for a jewellery showroom: upload a photo of an ornament,
generate 3–4 short UGC-style video ads from it with AI, pick a favourite,
get an Instagram caption written for you, and publish straight to Instagram
(or download the video to post manually).

Built for tablet use at the showroom counter.

```
Image upload → Generate videos (Creatify) → Pick one → Generate caption (OpenAI) → Publish (Instagram) or Download
```

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS (`frontend/`)
- **Backend:** Node.js + Express (`backend/`) — all third-party API calls
  (Creatify, OpenAI, Instagram) happen here, never in the browser, so your
  API keys are never exposed to the client.

## Project structure

```
.
├── .env.example          # every env var the app needs, with placeholders
├── backend/
│   ├── server.js         # Express app entry point
│   ├── routes/           # /api/upload, /api/videos, /api/caption, /api/instagram
│   ├── services/         # thin clients for Creatify / OpenAI / Instagram
│   └── uploads/          # locally-uploaded ornament photos get served from here
└── frontend/
    └── src/
        ├── App.jsx        # wizard state machine
        └── components/    # one component per wizard step
```

## 1. Prerequisites

- Node.js 18+ and npm
- A Creatify account with API access (paid plan required for API usage)
- An OpenAI API key with access to `gpt-4o-mini`
- A Meta/Facebook Developer app connected to an **Instagram Business or
  Creator account** linked to a Facebook Page (required for the Graph API)
- For local development only: a way to expose your backend over HTTPS
  publicly (e.g. [ngrok](https://ngrok.com)), because Creatify needs to
  download the photo you upload from a public URL, and Instagram needs to
  download the final video from a public URL. If you deploy the backend to
  a real server/host with a public domain, you don't need a tunnel.

## 2. Getting each API key

### Creatify (`CREATIFY_API_ID`, `CREATIFY_API_KEY`)

1. Sign up / log in at [app.creatify.ai](https://app.creatify.ai/).
2. Go to **Settings → API** in the dashboard.
3. Generate an API key. You'll be given an **API ID** and **API Key** pair —
   copy both.
4. Full API reference: https://docs.creatify.ai/

### OpenAI (`OPENAI_API_KEY`)

1. Log in at [platform.openai.com](https://platform.openai.com/).
2. Go to **API keys** → **Create new secret key**.
3. Copy the key immediately (it's only shown once).
4. Make sure billing is set up on the account — `gpt-4o-mini` calls are
   pay-as-you-go.

### Instagram Graph API (`IG_BUSINESS_ACCOUNT_ID`, `IG_ACCESS_TOKEN`)

This is the most involved part to set up because it goes through Meta's
developer platform. Broad strokes:

1. Make sure the showroom's Instagram account is a **Business or Creator**
   account, and is linked to a **Facebook Page** you (or the showroom)
   control.
2. Create an app at [developers.facebook.com/apps](https://developers.facebook.com/apps/).
   Add the **Instagram Graph API** product to it.
3. Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   (or the standard OAuth flow) to generate a **User access token** for your
   app with at least these permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
4. Exchange the short-lived token for a **long-lived token** (valid ~60
   days) via:
   ```
   GET https://graph.facebook.com/{graph-api-version}/oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id={app-id}
       &client_secret={app-secret}
       &fb_exchange_token={short-lived-token}
   ```
   Put the result in `IG_ACCESS_TOKEN`. You'll need to refresh this
   periodically — Meta does not currently offer non-expiring tokens for this
   flow.
5. Find your **Instagram Business Account ID**:
   ```
   GET https://graph.facebook.com/{graph-api-version}/me/accounts
       ?access_token={your-token}
   ```
   then, for the Page ID returned:
   ```
   GET https://graph.facebook.com/{graph-api-version}/{page-id}
       ?fields=instagram_business_account
       &access_token={your-token}
   ```
   The `instagram_business_account.id` field is your `IG_BUSINESS_ACCOUNT_ID`.
6. Full reference: https://developers.facebook.com/docs/instagram-platform/content-publishing

> **Note:** Meta's exact endpoints, required permissions, and app review
> requirements change over time and depend on your app's review status.
> The backend code has `// TODO: verify` comments at the exact spots you
> should double-check against the current docs before going live.

## 3. Install

```bash
# from the repo root
cd backend && npm install
cd ../frontend && npm install
```

## 4. Configure environment variables

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in the real values for:

| Variable | Description |
|---|---|
| `PORT` | Port the backend listens on (default `5000`) |
| `PUBLIC_BASE_URL` | Public HTTPS URL of the backend (needed so Creatify can fetch uploaded photos) |
| `CREATIFY_API_ID` / `CREATIFY_API_KEY` | From your Creatify dashboard |
| `OPENAI_API_KEY` | From your OpenAI dashboard |
| `IG_BUSINESS_ACCOUNT_ID` / `IG_ACCESS_TOKEN` | From the Meta/Instagram setup above |
| `GRAPH_API_VERSION` | Instagram Graph API version string, e.g. `v21.0` |

The frontend has no secrets and needs no `.env` file in development (Vite
proxies `/api` requests to the backend — see `frontend/vite.config.js`).

## 5. Run locally

In two terminals:

```bash
# Terminal 1 — backend
cd backend
npm run dev          # starts Express on http://localhost:5000

# Terminal 2 — frontend
cd frontend
npm run dev          # starts Vite on http://localhost:5173
```

Open http://localhost:5173 on a tablet or browser window.

If you want to actually generate videos or publish to Instagram (not just
click through the UI), remember the backend needs to be reachable on a
public URL — run `ngrok http 5000` and set `PUBLIC_BASE_URL` in
`backend/.env` to the `https://...ngrok-free.app` URL ngrok gives you, then
restart the backend.

## 6. How the flow works

1. **Image input** — upload a file (stored under `backend/uploads/` and
   served at `PUBLIC_BASE_URL/uploads/<file>`) or paste a public image URL
   directly.
2. **Generate videos** — backend calls Creatify's Product-to-Video API:
   `gen_image` (turns your photo into a clean product render) → `gen_video`
   (renders the first UGC video) → `regen_video` three more times (each
   produces an alternate video variation). The backend polls Creatify's
   status endpoint for each task and exposes its own
   `/api/videos/status/:jobId` endpoint that the frontend polls for a
   progress bar.
3. **Pick a video** — the 3–4 finished videos play inline in a grid.
4. **Generate caption** — backend sends the ornament photo + a style brief
   to OpenAI `gpt-4o-mini`, gets back one caption with hashtags, shown in an
   editable box.
5. **Publish** — "Post to Instagram" creates a Reels media container with
   the chosen video + caption, polls until Instagram finishes processing it,
   then publishes it. "Download video" downloads the MP4 directly.

## 7. Troubleshooting

- **"Video not ready" / stuck polling** — Creatify generation can take a few
  minutes per variation; the UI shows progress so this is expected. If it
  fails outright, check the backend logs for the Creatify error payload.
- **Instagram publish fails with a permissions error** — your access token
  has likely expired (they last ~60 days) or is missing a scope. Regenerate
  it following step 4 in the Instagram setup section above.
- **Creatify can't fetch your uploaded image** — `PUBLIC_BASE_URL` is
  probably still `localhost`. It must be a URL reachable from the public
  internet (see the ngrok note above).

## 8. Security notes

- All API keys live in `backend/.env`, which is git-ignored. They are read
  server-side only (`process.env.*`) and never sent to the browser.
- `.env.example` contains placeholder names only — no real secrets.
- Uploaded images are stored with randomly generated filenames; the upload
  route validates content type and size before accepting a file.
