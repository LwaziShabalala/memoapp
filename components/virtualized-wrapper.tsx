'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface VirtualizedWrapperProps {
  children: ReactNode;
}

const VirtualizedWrapper = ({ children }: VirtualizedWrapperProps) => {
  const [visibleItems, setVisibleItems] = useState<ReactNode[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemHeight = 100; // Adjust based on your content
  const bufferItems = 3; // Number of items to render above/below viewport
  
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current && children) {
      const containerHeight = containerRef.current.clientHeight;
      const totalItems = React.Children.count(children);
      
      // Calculate visible range
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems);
      const endIndex = Math.min(
        totalItems,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferItems
      );
      
      // Update visible items
      const visibleChildren = React.Children.toArray(children).slice(startIndex, endIndex);
      setVisibleItems(visibleChildren.map((child, index) => (
        <div
          key={startIndex + index}
          className="absolute w-full"
          style={{
            top: (startIndex + index) * itemHeight,
            height: itemHeight
          }}
        >
          {child}
        </div>
      )));
    }
  }, [children, scrollTop]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{
        height: '100vh',
        width: '100%'
      }}
    >
      <div
        className="relative"
        style={{
          height: React.Children.count(children) * itemHeight
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
};

export default VirtualizedWrapper;
