"use client";
import { useState, useEffect, useRef } from 'react';

const YouTubePlayer = () => {
    const [isLoading, setIsLoading] = useState(true);
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    
    // Your YouTube video ID
    const videoId = "oZXRsxB3hdY";
    
    useEffect(() => {
        // Load the YouTube IFrame Player API code asynchronously
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Function to be called when API is ready
        window.onYouTubeIframeAPIReady = initPlayer;
        
        // Clean up
        return () => {
            window.onYouTubeIframeAPIReady = null;
            if (playerRef.current) {
                playerRef.current.destroy();
            }
        };
    }, []);
    
    const initPlayer = () => {
        if (!containerRef.current) return;
        
        // Create YouTube player with custom parameters
        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: videoId,
            playerVars: {
                // Hide controls initially (we'll show them on hover via CSS)
                controls: 0,
                // Hide video info
                showinfo: 0,
                // Modest branding (smaller YouTube logo)
                modestbranding: 1,
                // Disable related videos
                rel: 0,
                // Disable keyboard controls
                disablekb: 1,
                // Hide YouTube logo
                iv_load_policy: 3,
                // Set highest quality
                vq: 'hd1080',
                // Hide annotations
                annotation: 0,
                // Disable fullscreen button
                fs: 0,
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };
    
    const onPlayerReady = (event) => {
        setIsLoading(false);
    };
    
    const onPlayerStateChange = (event) => {
        // You can add custom behavior here based on player state
    };
    
    return (
        <div className="relative group">
            {/* Gradient overlay */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            {/* Video container */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg z-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    )}
                    
                    {/* YouTube player container */}
                    <div className="aspect-video w-full rounded-lg overflow-hidden">
                        {/* This div will be replaced by the YouTube player */}
                        <div ref={containerRef} className="w-full h-full"></div>
                    </div>
                </div>
                
                {/* Custom control overlay (shows on hover) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        className="p-4 bg-gray-900/50 rounded-full hover:bg-gray-800/80 transition-colors"
                        onClick={() => {
                            if (playerRef.current) {
                                const state = playerRef.current.getPlayerState();
                                if (state === 1) { // 1 = playing
                                    playerRef.current.pauseVideo();
                                } else {
                                    playerRef.current.playVideo();
                                }
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-16 h-16 md:w-32 md:h-32 bg-violet-500/20 rounded-full blur-2xl md:blur-3xl"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl"></div>
            </div>
        </div>
    );
};

export default YouTubePlayer;
