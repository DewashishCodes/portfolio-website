// src/hooks/useIsMobile.ts
import { useState, useEffect } from 'react';

// This hook returns true if the screen width is less than a given breakpoint.
// We default to 768px, which is Tailwind's 'md' breakpoint.
const useIsMobile = (breakpoint = 768) => {
  // Default to false to prevent hydration errors during server-side rendering
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This function will run on the client side after hydration
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Run the check once on mount
    checkScreenSize();

    // Add an event listener to check whenever the window is resized
    window.addEventListener('resize', checkScreenSize);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]); // Re-run effect if the breakpoint changes

  return isMobile;
};

export default useIsMobile;