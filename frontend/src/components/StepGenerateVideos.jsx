import { useEffect, useRef, useState } from 'react';
import { startVideoGeneration, getVideoJobStatus } from '../api/client.js';
import Spinner from './Spinner.jsx';

const POLL_INTERVAL_MS = 3000;

export default function StepGenerateVideos({ imageUrl, onComplete, onBack }) {
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let timer;

    async function poll(jobId) {
      try {
        const data = await getVideoJobStatus(jobId);
        if (cancelled) return;
        setJob(data);
        if (data.status === 'completed') {
          onComplete(data.videos);
          return;
        }
        if (data.status === 'failed') {
          setError(data.error || 'Video generation failed.');
          return;
        }
        timer = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Lost connection while checking progress.');
      }
    }

    (async () => {
      try {
        const jobId = await startVideoGeneration(imageUrl);
        if (!cancelled) poll(jobId);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not start video generation.');
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // imageUrl is stable for the lifetime of this step; onComplete/onBack are
    // memoized in the parent, so this effect should only ever run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <h2 className="font-display text-2xl text-gray-800 mb-3">Something went wrong</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900"
        >
          ← Try a different photo
        </button>
      </div>
    );
  }

  const progress = job?.progress ?? 2;

  return (
    <div className="max-w-xl mx-auto text-center">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-800 mb-3">Creating your video ads</h2>
      <p className="text-gray-500 mb-8">{job?.message || 'Warming things up...'}</p>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gold-700 font-semibold mb-8">{progress}%</p>

      <Spinner />

      <p className="text-gray-400 text-sm mt-8">
        This usually takes a few minutes — feel free to leave this tab open.
      </p>
    </div>
  );
}
