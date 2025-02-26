"use client";

import { useState, useRef } from 'react';

const VideoComponent = () => {
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlayClick = () => {
        setIsLoading(true);
        
        // If video is already loaded, just play it
        if (isVideoLoaded && videoRef.current) {
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Error playing video:", error);
                    setIsLoading(false);
                });
        }
    };

    const handleVideoLoaded = () => {
        setIsVideoLoaded(true);
        setIsLoading(false);
        
        // Auto-play once loaded if user has clicked play
        if (isLoading && videoRef.current) {
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.error("Error auto-playing video:", error);
                });
        }
    };

    return (
        <div className="relative group">
            {/* Gradient overlay */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            {/* Container */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    
                    {/* High-quality thumbnail that shows before video loads */}
                    {!isPlaying && (
                        <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
                            {/* Thumbnail image */}
                            <img 
                                src="/video-thumbnail.jpg" 
                                alt="Video preview" 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Play button overlay */}
                            <div 
                                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                                onClick={handlePlayClick}
                            >
                                <div className="bg-indigo-600/90 hover:bg-indigo-500 p-4 rounded-full transition-all transform hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Loading state */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Actual video element - hidden until playing */}
                    <video
                        ref={videoRef}
                        className={`w-full rounded-lg shadow-md aspect-video ${isPlaying ? 'block' : 'hidden'}`}
                        controls={isPlaying}
                        muted
                        playsInline
                        preload="none"
                        poster="/video-thumbnail.jpg"
                        onLoadedData={handleVideoLoaded}
                    >
                        <source src="/landingvideo-small.mp4" type="video/mp4" />
                        <source src="/landingvideo-small.webm" type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-16 h-16 md:w-32 md:h-32 bg-violet-500/20 rounded-full blur-2xl md:blur-3xl"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl"></div>
            </div>
        </div>
    );
};

export default VideoComponent;
