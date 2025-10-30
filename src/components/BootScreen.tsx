// src/components/BootScreen.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const BootScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 5; 
      });
    }, 50);

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
          A cleaner, more stylized "DL" inside a monitor/window frame.
        */}
        <pre className="text-center text-lg md:text-xl mb-4 text-blue-400">
          {`
  +-----------------+
  |  ████╗  ██╗       |
  |  ██  ██ ██║       |
  |  ██  ██ ██║       |
  |  ████╔╝ ███████╗  |
  +-----------------+
          `}
        </pre>
        <p className="mb-4 text-center text-gray-400">Dewashish Lambore OS</p>
        
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