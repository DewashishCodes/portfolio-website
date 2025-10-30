import React from 'react';
import { motion } from 'framer-motion';

type WindowProps = {
  title: string;
  onClose: () => void;
  onFocus: () => void;
  zIndex: number;
  children: React.ReactNode;
  dragConstraintsRef: React.RefObject<HTMLElement | null>;
};

const Window = ({ title, onClose, onFocus, zIndex, children, dragConstraintsRef }: WindowProps) => {
  return (
    <motion.div
      style={{ zIndex }}
      onMouseDownCapture={onFocus}
      
      drag
      dragConstraints={dragConstraintsRef}
      dragMomentum={false}
      
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}

      className="absolute md:w-[700px] md:h-[500px] md:rounded-lg
                 flex flex-col bg-gray-800/60 backdrop-blur-xl text-white 
                 border border-white/20 shadow-2xl overflow-hidden"
    >
      <header
        // Stop propagation to prevent the main div's onFocus from firing when dragging the header
        onMouseDownCapture={(e) => e.stopPropagation()}
        className="flex items-center justify-between p-1 bg-gray-900/70 
                   border-b border-white/20 select-none cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2 pl-2">
          <button onClick={onClose} className="w-3.5 h-3.5 bg-red-500 rounded-full border border-red-600 hover:bg-red-400"></button>
          <div className="w-3.5 h-3.5 bg-yellow-500 rounded-full border border-yellow-600"></div>
          <div className="w-3.5 h-3.5 bg-green-500 rounded-full border border-green-600"></div>
        </div>
        <h2 className="text-sm font-medium flex-grow text-center">{title}</h2>
        <div className="w-16"></div>
      </header>

      <main
        // Stop propagation to prevent focus when clicking inside the content
        onMouseDownCapture={(e) => e.stopPropagation()}
        className="flex-grow p-4 overflow-y-auto bg-gray-900/30 cursor-default"
      >
        {children}
      </main>
    </motion.div>
  );
};

export default Window;