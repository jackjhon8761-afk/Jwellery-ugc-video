import { useState } from 'react';
import { publishToInstagram, downloadVideoHref } from '../api/client.js';
import { InlineSpinner } from './Spinner.jsx';

export default function StepPublish({ video, caption, onBack, onRestart }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [result, setResult] = useState(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setResult(null);
    try {
      const data = await publishToInstagram(video.url, caption);
      setResult({ success: true, mediaId: data.mediaId });
    } catch (err) {
      setResult({ success: false, error: err.message || 'Failed to publish.' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-800 mb-2">Ready to share</h2>
      <p className="text-gray-500 mb-6">Post straight to Instagram, or download the video to post yourself.</p>

      <div className="rounded-2xl overflow-hidden bg-black mb-6 mx-auto max-w-[200px]">
        <video src={video?.url} className="w-full aspect-[9/16] object-contain" controls playsInline />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 whitespace-pre-wrap text-gray-700 text-sm">
        {caption}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        >
          {isPublishing && <InlineSpinner />}
          {isPublishing ? 'Posting...' : '📸 Post to Instagram'}
        </button>
        <a
          href={downloadVideoHref(video.url)}
          download
          className="flex-1 px-6 py-4 rounded-xl bg-gray-800 text-white font-semibold text-center hover:bg-gray-900 transition-colors"
        >
          ⬇ Download video
        </a>
      </div>

      {result?.success && (
        <p className="mt-6 text-center text-green-700 bg-green-50 border border-green-200 rounded-xl py-3 px-4 font-medium">
          ✅ Posted to Instagram! (Media ID: {result.mediaId})
        </p>
      )}
      {result && !result.success && (
        <p className="mt-6 text-center text-red-700 bg-red-50 border border-red-200 rounded-xl py-3 px-4 font-medium">
          ⚠️ {result.error}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
