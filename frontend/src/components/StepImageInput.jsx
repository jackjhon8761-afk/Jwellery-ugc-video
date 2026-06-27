import { useCallback, useRef, useState } from 'react';
import { uploadImage } from '../api/client.js';

export default function StepImageInput({ onContinue }) {
  const [previewSrc, setPreviewSrc] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, or WEBP).');
      return;
    }
    setError('');
    setResolvedUrl('');
    setPreviewSrc(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setResolvedUrl(url);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleUseUrl = () => {
    const trimmed = pastedUrl.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      setError('Please paste a valid http(s) image URL.');
      return;
    }
    setError('');
    setPreviewSrc(trimmed);
    setResolvedUrl(trimmed);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl text-gray-800 mb-2">Add the ornament photo</h2>
      <p className="text-gray-500 mb-6">Drop a photo of the piece, or paste a public image link.</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 sm:p-12 min-h-[260px] cursor-pointer transition-colors
          ${isDragging ? 'border-gold-500 bg-gold-50' : 'border-gray-300 hover:border-gold-400 bg-white'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {previewSrc ? (
          <img src={previewSrc} alt="Ornament preview" className="max-h-64 rounded-lg shadow-md object-contain" />
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center text-2xl mb-4">📷</div>
            <p className="text-gray-600 font-medium">Tap to choose a photo, or drag one here</p>
            <p className="text-gray-400 text-sm mt-1">JPEG, PNG or WEBP — up to 15MB</p>
          </>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin" />
              <span className="text-gray-600 text-sm">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">or paste an image URL</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          inputMode="url"
          placeholder="https://example.com/ornament.jpg"
          value={pastedUrl}
          onChange={(e) => setPastedUrl(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        <button
          type="button"
          onClick={handleUseUrl}
          className="px-5 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors"
        >
          Use this link
        </button>
      </div>

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={!resolvedUrl || isUploading}
          onClick={() => onContinue(resolvedUrl)}
          className="px-6 py-3 rounded-xl bg-gold-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-600 transition-colors"
        >
          Generate videos →
        </button>
      </div>
    </div>
  );
}
