"use client";
import { useState, useRef, useEffect } from "react";

const CustomVideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Optional: Add play/pause functionality on click
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Ensure video is properly loaded
  useEffect(() => {
    if (videoRef.current) {
      // If video metadata is already loaded, update loading state
      if (videoRef.current.readyState >= 2) {
        setIsLoading(false);
      }
    }
  }, []);

  return (
    <div className="relative group w-full">
      {/* Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-3xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10"></div>
      
      {/* Video Container */}
      <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-gray-800/50 shadow-lg">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        {/* Video wrapper with fixed aspect ratio */}
        <div className="w-full aspect-video relative">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src="/videos/memoappvideo.mp4" 
            onLoadedData={handleVideoLoad}
            onClick={handleVideoClick}
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

export default CustomVideoComponent;
