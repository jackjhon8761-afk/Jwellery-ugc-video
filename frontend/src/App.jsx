import { useCallback, useState } from 'react';
import Stepper from './components/Stepper.jsx';
import StepImageInput from './components/StepImageInput.jsx';
import StepGenerateVideos from './components/StepGenerateVideos.jsx';
import StepPickVideo from './components/StepPickVideo.jsx';
import StepCaption from './components/StepCaption.jsx';
import StepPublish from './components/StepPublish.jsx';

export default function App() {
  const [step, setStep] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [caption, setCaption] = useState('');

  const handleImageReady = useCallback((url) => {
    setImageUrl(url);
    setStep(2);
  }, []);

  const handleVideosReady = useCallback((vids) => {
    setVideos(vids);
    setStep(3);
  }, []);

  const handleBackToImage = useCallback(() => {
    setStep(1);
    setImageUrl('');
    setVideos([]);
    setSelectedVideo(null);
    setCaption('');
  }, []);

  const handleVideoSelected = useCallback((video) => {
    setSelectedVideo(video);
    setStep(4);
  }, []);

  const handleBackToPick = useCallback(() => setStep(3), []);
  const handleCaptionContinue = useCallback(() => setStep(5), []);
  const handleBackToCaption = useCallback(() => setStep(4), []);

  const handleRestart = useCallback(() => {
    setStep(1);
    setImageUrl('');
    setVideos([]);
    setSelectedVideo(null);
    setCaption('');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gold-50 via-white to-white">
      <header className="border-b border-gold-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl text-gray-800 leading-tight">
              Jewellery UGC Video Studio
            </h1>
            <p className="text-xs text-gray-400 -mt-0.5">Photo → AI video ads → caption → publish</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Stepper current={step} />

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 md:p-10">
          {step === 1 && <StepImageInput onContinue={handleImageReady} />}

          {step === 2 && (
            <StepGenerateVideos imageUrl={imageUrl} onComplete={handleVideosReady} onBack={handleBackToImage} />
          )}

          {step === 3 && <StepPickVideo videos={videos} onSelect={handleVideoSelected} onBack={handleBackToImage} />}

          {step === 4 && (
            <StepCaption
              imageUrl={imageUrl}
              video={selectedVideo}
              caption={caption}
              onCaptionChange={setCaption}
              onContinue={handleCaptionContinue}
              onBack={handleBackToPick}
            />
          )}

          {step === 5 && (
            <StepPublish
              video={selectedVideo}
              caption={caption}
              onBack={handleBackToCaption}
              onRestart={handleRestart}
            />
          )}
        </div>
      </main>
    </div>
  );
}
