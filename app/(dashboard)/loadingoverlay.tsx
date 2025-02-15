"use client";
import React from 'react';
import { Loader2 } from "lucide-react";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg shadow-xl flex flex-col items-center max-w-md mx-4">
        <Loader2 className="h-12 w-12 text-violet-500 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Processing Your Audio
        </h3>
        <p className="text-zinc-400 text-center">
          It&apos;s taking a while to ensure accuracy. Please don&apos;t close this window.
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
