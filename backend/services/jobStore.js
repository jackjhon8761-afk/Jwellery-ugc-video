// Minimal in-memory job tracker for the async video-generation pipeline.
// This is an internal single-instance tool, so a Map is enough — no need
// for a database or Redis. Jobs are swept after a couple of hours so the
// process doesn't accumulate memory if it stays up for a long time.

const jobs = new Map();
const JOB_TTL_MS = 2 * 60 * 60 * 1000;

export function createJob(id, initial) {
  const job = { id, createdAt: Date.now(), ...initial };
  jobs.set(id, job);
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}

export function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, patch);
  return job;
}

setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 30 * 60 * 1000);
