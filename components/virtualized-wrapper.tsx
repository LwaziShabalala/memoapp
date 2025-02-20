// components/virtualized-wrapper.tsx
'use client';

import React, { useRef, ReactNode } from 'react';

interface VirtualizedWrapperProps {
  children: ReactNode;
}

const VirtualizedWrapper = ({ children }: VirtualizedWrapperProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  return (
    <div
      ref={containerRef}
      className="relative overflow-auto min-h-screen w-full"
    >
      {children}
    </div>
  );
};

export default VirtualizedWrapper;
