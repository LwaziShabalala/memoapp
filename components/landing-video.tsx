"use client";

import { useState, useEffect, useRef } from "react";
import Video from "next-video";
import landingvideo from "@/videos/memoappvideo.mp4";

const VideoComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = () => setIsLoading(false);

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const video = containerRef.current.querySelector("video");
      if (video) {
        video.classList.add("w-full", "h-full", "object-cover");
      }
    }
  }, [isLoading]);

  return (
    <div className="relative group w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-xl overflow-hidden">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
        </div>
      )}

      {/* Video background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 blur-2xl opacity-60 -z-10" />

      <div ref={containerRef} className="w-full h-full">
        <Video
          src={landingvideo}
          onLoadedData={handleVideoLoad}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default VideoComponent;
