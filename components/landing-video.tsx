"use client";

import { useState, useEffect, useRef } from 'react';

const VideoComponent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Observer to detect when video enters viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Handle video load event
    const handleVideoLoaded = () => {
        setIsLoaded(true);
    };

    return (
        <div className="relative group" ref={containerRef}>
            {/* Gradient overlay */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            {/* Video container */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    {/* Loading animation shown until video loads */}
                    {(!isLoaded && isVisible) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    )}
                    
                    {/* Placeholder shown until intersection */}
                    {!isVisible ? (
                        <div className="w-full aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                            <div className="text-gray-400">Loading preview...</div>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            onLoadedData={handleVideoLoaded}
                            className="w-full rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)] md:shadow-[0_0_25px_rgba(0,0,0,0.3)] transform group-hover:scale-[1.01] transition duration-300 aspect-video"
                            poster="/video-poster.jpg"
                        >
                            {/* Smaller mobile version first */}
                            <source src="/landingvideo-mobile.webm" type="video/webm" media="(max-width: 768px)" />
                            <source src="/landingvideo-mobile.mp4" type="video/mp4" media="(max-width: 768px)" />
                            
                            {/* Desktop version */}
                            <source src="/landingvideo.webm" type="video/webm" />
                            <source src="/landingvideo.mp4" type="video/mp4" />
                            
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-16 h-16 md:w-32 md:h-32 bg-violet-500/20 rounded-full blur-2xl md:blur-3xl"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl"></div>
            </div>
        </div>
    );
};

export default VideoComponent;
