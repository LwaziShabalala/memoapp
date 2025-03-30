"use client";
import { useState } from 'react';
import Video from 'next-video';
import landingvideo from '@/videos/memoappvideo.mp4';

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative group">
      {/* Gradient overlay */}
      <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>

      {/* Video container - Removed extra divs and forced full width/height */}
      <div className="relative w-full h-full">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        <Video 
          src={landingvideo}
          className="w-full h-full object-cover"
          onLoadedData={() => setIsLoading(false)}
          controls={false}
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    </div>
  );
};

export default VideoComponent;
