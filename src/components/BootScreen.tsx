// src/components/BootScreen.tsx
import { useState, useEffect } from 'react';

const bootMessages = [
  "Initializing kernel...",
  "Loading user modules...",
  "Mounting virtual file systems...",
  "Checking hardware integrity...",
  "Starting UI server... [OK]",
  "Welcome to Dewashish's Portfolio OS!",
];

const BootScreen = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (currentMessageIndex < bootMessages.length - 1) {
      const timer = setTimeout(() => {
        setCurrentMessageIndex(currentMessageIndex + 1);
      }, 500 + Math.random() * 300); // Random delay for realism

      return () => clearTimeout(timer);
    }
  }, [currentMessageIndex]);

  return (
    <div className="bg-black text-green-400 font-mono h-screen w-screen p-4 flex flex-col justify-start">
      {bootMessages.slice(0, currentMessageIndex + 1).map((msg, index) => (
        <p key={index}>
          <span className="text-green-600">&gt; </span>{msg}
        </p>
      ))}
      {currentMessageIndex === bootMessages.length - 1 && (
        <p className="mt-2 animate-pulse">
          <span className="text-green-600">&gt; </span>_
        </p>
      )}
    </div>
  );
};

export default BootScreen;