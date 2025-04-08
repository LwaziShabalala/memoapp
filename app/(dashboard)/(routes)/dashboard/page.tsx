"use client";
import { useAuth, RedirectToSignIn, useUser } from "@clerk/nextjs";
import RecordButton from "@/components/recordbutton";
import UploadButton, { handlePdfFile } from "@/components/uploadbutton";
import React, { useCallback, useState, useEffect } from "react";
import { useTranscription } from "@/app/transcriptioncontext";
import FilenameModal from "@/components/ui/filenamemodal";
import ReferralModal from "@/components/ui/referralmodal";
import emailjs from "@emailjs/browser";

// Initialize EmailJS with your public key
emailjs.init("OZmeuEFrsHTm_D2yQ");

const DashboardPage: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [showFilenameModal, setShowFilenameModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const { setTranscription, setFilename } = useTranscription();
  
  // Check localStorage on component mount to determine if we should show the referral modal
  useEffect(() => {
    if (isSignedIn) {
      const hasAnsweredReferral = localStorage.getItem("hasAnsweredReferral");
      if (!hasAnsweredReferral) {
        setShowReferralModal(true);
      }
    }
  }, [isSignedIn]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      await handlePdfFile(pdfFile, setTranscription, setShowFilenameModal);
    }
  }, [setTranscription]);
  
  const handleSave = (filename: string) => {
    setFilename(filename);
    setShowFilenameModal(false);
  };
  
  const handleReferralSubmit = (referrerName: string) => {
    console.log("User was referred by:", referrerName);
    
    // Mark that the user has answered the referral question
    localStorage.setItem("hasAnsweredReferral", "true");
    
    // Close the modal
    setShowReferralModal(false);
  };
  
  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  
  return (
    <div
      className={`bg-gray-950 flex flex-col items-center justify-start min-h-screen pt-16 relative
        ${isDragging ? 'after:absolute after:inset-0 after:bg-violet-500/10 after:border-2 after:border-dashed after:border-violet-500 after:rounded-lg' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-violet-500 text-xl font-semibold bg-gray-950/90 px-6 py-3 rounded-lg">
            Drop your PDF here
          </div>
        </div>
      )}
      
      <div className="mb-8 space-y-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Quick Text from Audio & PDFs
        </h2>
        <p className="text-zinc-400 font-light text-sm md:text-lg">
          Fast, accurate transcription when you need it
        </p>
      </div>
      
      {/* Buttons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <RecordButton />
        <UploadButton />
      </div>
      
      <FilenameModal
        open={showFilenameModal}
        onClose={() => setShowFilenameModal(false)}
        onSave={handleSave}
      />
      
      {/* Non-dismissible Referral Modal */}
      {showReferralModal && (
        <ReferralModal onSubmit={handleReferralSubmit} />
      )}
    </div>
  );
};

export default DashboardPage;
