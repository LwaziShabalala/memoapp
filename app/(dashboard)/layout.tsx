"use client";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { TranscriptionProvider } from "./transcriptioncontext";
import { LoadingProvider } from "./loadingcontext";
import LoadingOverlay from "./loadingoverlay";
import { useLoading } from "./loadingcontext";

const DashboardContent = ({ children }: { children: React.ReactNode }) => {
  const { isProcessing } = useLoading();
  
  return (
    <div className="h-full relative">
      {isProcessing && <LoadingOverlay />}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        <Navbar />
        {children}
      </main>
    </div>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <LoadingProvider>
      <TranscriptionProvider>
        <DashboardContent>{children}</DashboardContent>
      </TranscriptionProvider>
    </LoadingProvider>
  );
};

export default DashboardLayout;
