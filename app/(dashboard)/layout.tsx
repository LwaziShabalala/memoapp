"use client";

import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { TranscriptionProvider } from "../transcriptioncontext";
import { LoadingProvider, useLoading } from "./loadingcontext";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isProcessing } = useLoading();

  return (
    <TranscriptionProvider>
      <LoadingProvider>
        <div className={`h-full relative ${isProcessing ? "pointer-events-none" : ""}`}>
          {/* Sidebar */}
          <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
            <Sidebar />
          </div>

          {/* Main Content */}
          <main className="md:pl-72">
            <Navbar />
            {children}
          </main>

          {/* Loading Overlay (Only in Layout) */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4">
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
