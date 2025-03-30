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

  // Apply direct styling to fix the video element
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      // Get all video elements within the container
      const videoElements = containerRef.current.querySelectorAll('video');
      const playerElements = containerRef.current.querySelectorAll('[data-video-player]');
      const divElements = containerRef.current.querySelectorAll('div');
      
      // Apply styles to all found elements
      videoElements.forEach(element => {
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.objectFit = 'cover';
      });

      playerElements.forEach(element => {
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100%';
        element.style.height = '100%';
      });

      divElements.forEach(element => {
        if (element === containerRef.current) return;
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100%';
        element.style.height = '100%';
      });
    }
  }, [isLoading]);

  return (
    <div className="relative group w-full h-full">
      {/* Gradient overlay */}
      <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
      
      {/* Video container */}
      <div className="relative w-full h-full">
        <div className="rounded-xl bg-gray-900/50 overflow-hidden ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0_0_30px_rgba(0,0,0,0.5)] w-full h-full">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {/* Video wrapper with fixed height */}
          <div ref={containerRef} className="relative w-full h-full overflow-hidden video-wrapper">
            <div className="absolute inset-0">
              <Video 
                src={landingvideo}
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
        
        {/* Decorative elements */}
        <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-16 h-16 md:w-32 md:h-32 bg-violet-500/20 rounded-full blur-2xl md:blur-3xl"></div>
        <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl"></div>
      </div>
    </div>
  );
};

export default VideoComponent;
