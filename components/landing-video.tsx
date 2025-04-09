"use client";
import { useState, useEffect } from "react";
// Import your video file the way it was originally imported
import landingvideo from "@/videos/memoappvideo.mp4";

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Handle video load
  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Use useEffect to set a timeout to prevent infinite loading
  useEffect(() => {
    // Safety timeout to prevent infinite loading state
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Force loading to end after 3 seconds

    return () => clearTimeout(timeout);
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
        
        {/* Video Container */}
        <div className="w-full aspect-video relative">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={landingvideo} // Use the imported video
            onLoadedData={handleVideoLoad}
            onError={() => setIsLoading(false)} // Handle errors by removing loading screen
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
