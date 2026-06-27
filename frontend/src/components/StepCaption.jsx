import { useEffect, useState } from 'react';
import { generateCaption } from '../api/client.js';
import Spinner from './Spinner.jsx';

export default function StepCaption({ imageUrl, video, caption, onCaptionChange, onContinue, onBack }) {
  const [isLoading, setIsLoading] = useState(!caption);
  const [error, setError] = useState('');

  useEffect(() => {
    if (caption) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const text = await generateCaption(imageUrl);
        if (!cancelled) onCaptionChange(text);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not generate a caption.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once on mount unless there's no caption yet to fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const text = await generateCaption(imageUrl);
      onCaptionChange(text);
    } catch (err) {
      setError(err.message || 'Could not generate a caption.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-800 mb-2">Write the caption</h2>
      <p className="text-gray-500 mb-6">Generated for your selected video. Feel free to tweak it before posting.</p>

      <div className="rounded-2xl overflow-hidden bg-black mb-6 mx-auto max-w-[200px]">
        <video src={video?.url} className="w-full aspect-[9/16] object-contain" muted playsInline />
      </div>

      {isLoading && !caption ? (
        <div className="flex justify-center py-10">
          <Spinner label="Writing a caption..." />
        </div>
      ) : (
        <>
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 rounded-xl p-4 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
            placeholder="Your caption will appear here..."
          />
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isLoading}
            className="mt-3 text-sm font-semibold text-gold-700 hover:text-gold-800 disabled:opacity-40"
          >
            {isLoading ? 'Regenerating...' : '↻ Regenerate caption'}
          </button>
        </>
      )}

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

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
          disabled={!caption?.trim()}
          onClick={onContinue}
          className="px-6 py-3 rounded-xl bg-gold-500 text-white font-semibold disabled:opacity-40 hover:bg-gold-600"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
