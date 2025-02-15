"use client";

import { useState } from "react";
import { useAuth, RedirectToSignUp } from "@clerk/nextjs";
import RecordButton from "@/components/recordbutton";
import UploadButton from "@/components/uploadbutton";

const DashboardPage = () => {
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
      {/* Heading Section */}
      <div className="mb-8 space-y-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Transcribe Audio and PDFs Seamlessly
        </h2>
        <p className="text-zinc-400 font-light text-sm md:text-lg">
          Whether it&apos;s a lecture recording or a PDF, our AI delivers fast, accurate transcriptions so you can focus on what matters.
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
