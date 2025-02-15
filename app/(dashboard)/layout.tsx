"use client";
import { useState } from "react";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { TranscriptionProvider } from "../transcriptioncontext"; 
import { LoadingProvider } from "./loadingcontext";
import { Loader2 } from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    return (
        <TranscriptionProvider>
            <LoadingProvider>
                <div className={`h-full relative ${isProcessing ? "pointer-events-none" : ""}`}>
                    {/* Sidebar - Will also be disabled during processing */}
                    <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                        <Sidebar />
                    </div>

                    {/* Main Content */}
                    <main className="md:pl-72 relative">
                        <Navbar />
                        {children}
                    </main>

                    {/* Loading Overlay - Covers Everything */}
                    {isProcessing && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] pointer-events-auto">
                            <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4">
                                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                                <p className="text-lg font-medium text-gray-900">Processing your audio...</p>
                                <p className="text-sm text-gray-500 text-center">
                                    This may take a while to ensure accurate transcription
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </LoadingProvider>
        </TranscriptionProvider>
    );
};

export default DashboardLayout;
