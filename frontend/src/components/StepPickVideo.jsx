import { useState } from 'react';

export default function StepPickVideo({ videos, onSelect, onBack }) {
  const [selectedId, setSelectedId] = useState(videos[0]?.id ?? null);
  const selected = videos.find((v) => v.id === selectedId);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-800 mb-2">Pick your favourite</h2>
      <p className="text-gray-500 mb-6">
        {videos.length} video{videos.length === 1 ? '' : 's'} ready. Tap one to select it, then continue.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {videos.map((video, idx) => {
          const isSelected = selectedId === video.id;
          return (
            <div
              key={video.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => setSelectedId(video.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedId(video.id);
              }}
              className={`relative rounded-2xl overflow-hidden border-4 transition-all bg-black cursor-pointer
                ${isSelected ? 'border-gold-500 ring-2 ring-gold-300' : 'border-transparent hover:border-gold-200'}`}
            >
              <video
                src={video.url}
                controls
                playsInline
                className="w-full aspect-[9/16] max-h-[420px] object-contain bg-black"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full pointer-events-none">
                Option {idx + 1}
              </span>
              {isSelected && (
                <span className="absolute top-2 right-2 bg-gold-500 text-white text-xs font-semibold px-2 py-1 rounded-full pointer-events-none">
                  ✓ Selected
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
        >
          ← Start over
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => onSelect(selected)}
          className="px-6 py-3 rounded-xl bg-gold-500 text-white font-semibold disabled:opacity-40 hover:bg-gold-600"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
