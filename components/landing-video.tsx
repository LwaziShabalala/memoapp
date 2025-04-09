"use client";
import { useState } from "react";
import Video from "next-video";
import landingvideo from "@/videos/memoappvideo.mp4";

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative group w-full">
      {/* Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-3xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10"></div>
      
      {/* This is the main video container - no padding/margin */}
      <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-gray-800/50 shadow-lg">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        
        {/* 
          Override the Next Video component's default styles 
          The key is removing any default padding/margin that might be creating space
        */}
        <div className="w-full aspect-video" style={{ margin: 0, padding: 0 }}>
          {/* 
            Apply style overrides directly to next-video
            The surrounding div should have no padding or margin
            We force the video to take up 100% height/width
          */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            margin: 0, 
            padding: 0, 
            overflow: 'hidden',
            position: 'relative'
          }}>
            <Video
              src={landingvideo}
              onLoadedData={handleVideoLoad}
              controls={false}
              autoPlay
              muted
              loop
              playsInline
              // Apply custom styles directly to the video component
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                margin: 0,
                padding: 0
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoComponent;
