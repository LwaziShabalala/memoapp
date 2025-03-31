"use client";
import { useState, useEffect, useRef } from 'react';
import Video from 'next-video';
import landingvideo from '@/videos/memoappvideo.mp4';

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const videoElements = containerRef.current.querySelectorAll('video');
      videoElements.forEach(video => {
        video.style.width = '100%';
        video.style.height = 'auto'; // Adjusted to auto instead of 100%
        video.style.objectFit = 'contain'; // Ensures proper aspect ratio
      });
    }
  }, [isLoading]);

  return (
    <div className="relative group overflow-hidden w-full max-w-4xl mx-auto">
      {/* Video container */}
      <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-gray-800/50 shadow-lg">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Video */}
        <div ref={containerRef} className="w-full">
          <Video 
            src={landingvideo}
            className="w-full h-auto"
            onLoadedData={handleVideoLoad}
            controls={false}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>
    </div>
  );
};

export default VideoComponent;
