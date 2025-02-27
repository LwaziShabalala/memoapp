"use client";

import { useState } from 'react';

const VideoComponent = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Your YouTube video ID
    const videoId = "oZXRsxB3hdY";

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className="relative group">
            {/* Gradient overlay */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            {/* Video container */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0,0_30px_rgba(0,0,0,0.5)]">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    )}
                    
                    {/* YouTube iframe */}
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1`}
                            title="Video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                            onLoad={handleIframeLoad}
                        ></iframe>
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
