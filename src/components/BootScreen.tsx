// src/components/BootScreen.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BootScreen = () => {
  const [progress, setProgress] = useState(0);

  // Effect for the visual progress bar
  useEffect(() => {
    // This timer will fill the progress bar over ~2 seconds.
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        // Increase progress more quickly for a shorter boot time
        return prev + 5; 
      });
    }, 50); // Interval runs every 50ms

    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="bg-black text-gray-300 font-mono h-screen w-screen flex items-center justify-center overflow-hidden">
      <motion.div
        key="visual-phase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        {/* 
          New ASCII Art Logo: 
          Represents "DL" for Dewashish Lambore, inside a computer screen/window.
        */}
        <pre className="text-center text-lg md:text-xl mb-4 text-blue-400">
          {`
  +-----------------+
  |   _/_/_/  _/      |
  |  _/    _/ _/      |
  | _/    _/ _/       |
  | _/_/_/  _/_/_/_/  |
  +-----------------+
          `}
        </pre>
        <p className="mb-4 text-center text-gray-400">Dewashish Lambore OS</p>
        
        {/* Progress Bar */}
        <div className="w-64 h-2 bg-gray-800 border border-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-400 transition-all duration-150 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </motion.div>
    </div>
  );
};

export default BootScreen;