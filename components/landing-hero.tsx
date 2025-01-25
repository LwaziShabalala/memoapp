"use client";

import TypewriterComponent from "typewriter-effect";
import { Button } from "./ui/button";
import Link from "next/link";

export const LandingHero = () => {
    return (
        <div className="text-white font-bold py-20 text-center space-y-6"> {/* Reduced space-y */}
            {/* Centered Glow Effect */}
            <div className="relative">
                {/* Background Glow */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-[600px] h-[600px] bg-gradient-to-r from-purple-700 via-blue-600 to-indigo-800 
                    rounded-full blur-[150px] opacity-50"
                ></div>

                {/* Text Content */}
                <div className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl space-y-4 font-extrabold"> {/* Reduced space-y */}
                    <h1 className="tracking-tight capitalize">
                        Used by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Ivy League Students</span>
                    </h1>
                    <div className="relative">
                        <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                            <div
                                style={{
                                    lineHeight: "1.2", // Ensures the text won't clip vertically
                                    display: "inline-block", // Prevents inline clipping issues
                                    padding: "0.2em 0", // Adds extra spacing to avoid clipping
                                }}
                            >
                                <TypewriterComponent
                                    options={{
                                        strings: [
                                            "Less Studying",
                                            "More Living",
                                            "Get the Memo",
                                        ],
                                        autoStart: true,
                                        loop: true,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subtitle */}
                <p className="text-sm md:text-lg font-light text-zinc-400 max-w-3xl mx-auto pt-4 md:pt-8"> {/* Reduced padding */}
                    Switch stressful studying for simple summaries. Memo turns hour long lectures into fifteen-minute lessons.
                </p>

                {/* Call-to-Action Button */}
                <div className="relative z-10 pt-6"> {/* Reduced padding */}
                    <Link href="/payment-wall">
                        <Button
                            variant="secondary"
                            className="md:text-lg px-8 py-4 rounded-full font-semibold shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.3)] transition-transform transform hover:scale-105 duration-300"
                        >
                            Get Started Now
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
