"use client";

import { FileText, Mic, BrainCircuit } from "lucide-react";
import Link from "next/link";

const FeaturesSection = () => {
    const features = [
        {
            icon: <FileText className="w-10 h-10 text-white" />,
            title: "PDF Transcription",
            description: "Convert PDF documents into editable and searchable text.",
            customClass: "from-pink-600/20 to-purple-600/20",
        },
        {
            icon: <Mic className="w-10 h-10 text-white" />,
            title: "Audio Transcription",
            description: "Easily transcribe audio files into accurate text.",
            customClass: "from-blue-600/20 to-cyan-600/20",
        },
        {
            icon: <BrainCircuit className="w-10 h-10 text-white" />,
            title: "Quiz Generation",
            description: "Generate quizzes from text for interactive learning.",
            customClass: "from-violet-600/20 to-indigo-600/20",
        },
    ];

    return (
        <div className="w-full py-20">

            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Explore Our Features
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Discover the tools designed to enhance your workflow and productivity.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="relative group">
                            {/* Glow Effect */}
                            <div
                                className={`absolute -inset-px bg-gradient-to-r ${feature.customClass} rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500`}
                            ></div>

                            {/* Card */}
                            <div className="relative bg-gray-800 rounded-2xl p-8 hover:bg-gray-800/80 transition-colors duration-300">
                                <div className="space-y-4">
                                    {/* Icon */}
                                    <div className="bg-gray-900 rounded-xl p-3 w-fit">
                                        {feature.icon}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-semibold text-white">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-400 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Help Section */}
                <div className="mt-32 text-center relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-[150px] opacity-70"></div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative">
                        We&#39;re here to guide and help<br />
                        you at all times
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-8 relative">
                        Our team and tools are always available to ensure your success.
                    </p>
                    <Link href="/payment-wall">
                        <button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity relative">
                            Get Started
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FeaturesSection;
