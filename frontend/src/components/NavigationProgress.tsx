'use client';

import { useEffect, useState } from 'react';
import { useLocation } from '@/lib/router';

export default function NavigationProgress() {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset progress when route changes complete
  useEffect(() => {
    setIsNavigating(false);
    setProgress(0);
  }, [location.hash, location.pathname, location.search]);

  // Listen for navigation start via custom event
  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true);
      setProgress(30);
    };

    window.addEventListener('navigation-start', handleStart);
    return () => window.removeEventListener('navigation-start', handleStart);
  }, []);

  // Animate progress while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isNavigating]);

  if (!isNavigating) return null;

  return (
    <div className='fixed left-0 right-0 top-0 z-[9999] h-1 bg-gray-100'>
      <div
        className='h-full bg-primary-500 transition-all duration-200 ease-out'
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Helper to trigger navigation start
export function triggerNavigationStart() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('navigation-start'));
  }
}
