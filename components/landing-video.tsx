const VideoComponent = () => {
    return (
        <div className="relative group">
            {/* Larger gradient overlay */}
            <div className="absolute -inset-2 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000"></div>

            {/* Video container with styling */}
            <div className="relative">
                <div className="rounded-xl bg-gray-900/50 p-1 ring-1 ring-gray-800/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full rounded-lg shadow-[0_0_25px_rgba(0,0,0,0.3)] transform group-hover:scale-[1.01] transition duration-300"
                    >
                        <source src="/landingvideo.webm" type="video/webm" />
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* Larger decorative elements */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default VideoComponent;