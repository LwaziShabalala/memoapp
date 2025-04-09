"use client";
import { useState, useEffect } from "react";
import Video from "next-video";
import landingvideo from "@/videos/memoappvideo.mp4";

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Add effect to directly manipulate the DOM after rendering
  useEffect(() => {
    // Function to apply styles to video elements
    const applyVideoStyles = () => {
      // Target all video elements in the document or in a specific container
      const videos = document.querySelectorAll('.next-video-container video');
      videos.forEach(video => {
        // Apply inline styles directly to the video element
        video.setAttribute('style', 'width: 100% !important; height: 100% !important; object-fit: cover !important; position: absolute !important; top: 0 !important; left: 0 !important;');
      });
      
      // Target the container elements
      const containers = document.querySelectorAll('.next-video-container');
      containers.forEach(container => {
        container.setAttribute('style', 'width: 100% !important; height: 100% !important; position: relative !important;');
      });
    };

    // Apply styles immediately and after a delay to ensure they apply after next-video renders
    applyVideoStyles();
    const timeoutId = setTimeout(applyVideoStyles, 500);
    
    // Clean up timeout
    return () => clearTimeout(timeoutId);
  }, [isLoading]); // Re-run when loading state changes

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
        <div className="w-full" style={{ aspectRatio: '16/9', position: 'relative' }}>
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
  );
};

export default VideoComponent;
