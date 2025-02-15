"use client"
import { useState } from "react";
import { useAuth, RedirectToSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import RecordButton from "@/components/recordbutton";
import UploadButton from "@/components/uploadbutton";

const DashboardPage: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Wait for Clerk to load and check if user is signed in
  if (!isLoaded) return null;

  // If the user is not signed in, redirect to the sign-in page
  if (!isSignedIn) {
    return <RedirectToSignUp />;
  }

  return (
    <div className="bg-gray-950 flex flex-col items-center justify-start min-h-screen pt-16 relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <p className="text-lg font-medium text-gray-900">Processing your audio...</p>
            <p className="text-sm text-gray-500 text-center">
              This may take a while to ensure accurate transcription
            </p>
          </div>
        </div>
      )}

      {/* Heading Section */}
      <div className="mb-8 space-y-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Transcribe Audio and PDFs Seamlessly
        </h2>
        <p className="text-zinc-400 font-light text-sm md:text-lg">
          Whether it's a lecture recording or a PDF, our AI delivers fast, accurate transcriptions so you can focus on what matters.
        </p>
      </div>

      {/* Buttons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <RecordButton onProcessingChange={setIsProcessing} />
        <UploadButton />
      </div>
    </div>
  );
};

export default DashboardPage;
