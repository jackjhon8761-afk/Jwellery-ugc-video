// Orchestrates the multi-step, async Creatify flow behind a single job that
// the frontend can poll for progress:
//   gen_image -> poll -> gen_video -> poll        (variation 1)
//                      -> regen_video -> poll      (variation 2)
//                      -> regen_video -> poll      (variation 3)
//                      -> regen_video -> poll      (variation 4)

import { nanoid } from 'nanoid';
import * as creatify from './creatify.js';
import { createJob, updateJob, getJob } from './jobStore.js';

const VARIATIONS = 4;
const FAILED_STATUSES = new Set(['failed', 'error']);

const IMAGE_POLL = { intervalMs: 4000, timeoutMs: 5 * 60 * 1000 };
const VIDEO_POLL = { intervalMs: 6000, timeoutMs: 8 * 60 * 1000 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollTask(taskId, isDone, { intervalMs, timeoutMs }) {
  const startedAt = Date.now();
  for (;;) {
    const task = await creatify.getTaskStatus(taskId);
    if (FAILED_STATUSES.has(task.status)) {
      throw new Error(`Creatify could not finish this video (status: ${task.status}).`);
    }
    if (isDone(task)) return task;
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Creatify took too long (last status: "${task.status}").`);
    }
    await sleep(intervalMs);
  }
}

export function startVideoJob(imageUrl) {
  const jobId = nanoid();
  createJob(jobId, {
    status: 'running',
    progress: 0,
    message: 'Starting...',
    videos: [],
    error: null,
  });

  runPipeline(jobId, imageUrl).catch((err) => {
    updateJob(jobId, {
      status: 'failed',
      error: err.message || 'Something went wrong while generating videos.',
    });
  });

  return jobId;
}

async function runPipeline(jobId, imageUrl) {
  updateJob(jobId, { progress: 5, message: 'Sending photo to Creatify...' });
  const imageTask = await creatify.genImage(imageUrl);

  updateJob(jobId, { progress: 12, message: 'Generating a clean product preview...' });
  const readyImageTask = await pollTask(
    imageTask.id,
    (t) => t.status === 'image_generated',
    IMAGE_POLL,
  );

  updateJob(jobId, { progress: 25, message: 'Preview ready. Rendering video variations...' });

  const taskIds = [readyImageTask.id];
  await creatify.genVideo(readyImageTask.id);

  for (let i = 1; i < VARIATIONS; i++) {
    const regen = await creatify.regenVideo(readyImageTask.id);
    taskIds.push(regen.id);
  }

  const videos = [];
  const failures = [];

  for (let i = 0; i < taskIds.length; i++) {
    updateJob(jobId, {
      progress: 25 + Math.round(((i + 1) / taskIds.length) * 65),
      message: `Rendering video ${i + 1} of ${taskIds.length}...`,
    });
    try {
      const finished = await pollTask(
        taskIds[i],
        (t) => t.status === 'video_generated',
        VIDEO_POLL,
      );
      videos.push({
        id: finished.id,
        url: finished.generated_video_url,
        thumbnailUrl: finished.generated_photo_url || null,
      });
    } catch (err) {
      failures.push(err.message);
    }
  }

  if (videos.length === 0) {
    throw new Error(failures[0] || 'Creatify did not return any finished videos.');
  }

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    message:
      failures.length > 0
        ? `${videos.length} video${videos.length === 1 ? '' : 's'} ready (${failures.length} variation${failures.length === 1 ? '' : 's'} failed).`
        : 'All videos ready!',
    videos,
    warnings: failures.length > 0 ? failures : undefined,
  });
}

export { getJob };
