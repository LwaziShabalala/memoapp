const VideoComponent = () => {
    return (
        <div className="relative group">
            {/* Responsive gradient overlay */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            
            {/* Video container with responsive styling */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.3)] md:shadow-[0_0_25px_rgba(0,0,0,0.3)] transform group-hover:scale-[1.01] transition duration-300"
                        poster="/video-poster.jpg" // Add a poster image for better loading experience
                    >
                        <source src="/landingvideo.webm" type="video/webm" />
                        <source src="/landingvideo.mp4" type="video/mp4" /> {/* Add MP4 fallback for better compatibility */}
                        Your browser does not support the video tag.
                    </video>
                </div>
                
                {/* Responsive decorative elements */}
                <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-16 h-16 md:w-32 md:h-32 bg-violet-500/20 rounded-full blur-2xl md:blur-3xl"></div>
                <div className="absolute -top-2 -left-2 md:-top-4 md:-left-4 w-16 h-16 md:w-32 md:h-32 bg-indigo-500/20 rounded-full blur-2xl md:blur-3xl"></div>
            </div>
        </div>
    );
};

export default VideoComponent;
