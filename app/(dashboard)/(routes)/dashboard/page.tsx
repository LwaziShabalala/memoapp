"use client";
import { useAuth, RedirectToSignUp } from "@clerk/nextjs";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";
import { LoadingProvider } from "@/app/(dashboard)/loadingcontext";

// Dynamically import components that use the loading context
const RecordButton = dynamic(() => import("@/components/recordbutton"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center">
      <div className="p-6 border-black/5 flex flex-col items-center justify-center transition w-40 h-40">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    </div>
  ),
});

const UploadButton = dynamic(() => import("@/components/uploadbutton"), {
  ssr: false,
});

// Separate component for the dashboard content
const DashboardContent = () => {
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
        <RecordButton />
        <UploadButton />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return <RedirectToSignUp />;
  }

  return (
    <LoadingProvider>
      <DashboardContent />
    </LoadingProvider>
  );
};

export default DashboardPage;
