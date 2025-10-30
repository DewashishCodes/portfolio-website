// src/components/Dock.tsx
import { BsFolder, BsPersonFill } from 'react-icons/bs';
import { MdEmail } from 'react-icons/md';
import { FaTrophy, FaBriefcase, FaFilePdf, FaTerminal } from 'react-icons/fa';
import { IoMdSettings } from 'react-icons/io';
import { FaFolderOpen } from 'react-icons/fa';


type DockProps = {
  openApp: (appId: string) => void;
};

// --- We will keep the same apps array ---
const apps = [
  { id: 'about', name: 'About Me', icon: <BsPersonFill size={28} /> },
  { id: 'projects', name: 'Projects', icon: <BsFolder size={28} /> },
  { id: 'experience', name: 'Experience', icon: <FaBriefcase size={28} /> },
  { id: 'resume', name: 'Resume', icon: <FaFilePdf size={28} /> },
  { id: 'hackathons', name: 'Hackathons', icon: <FaTrophy size={28} /> },
  { id: 'terminal', name: 'Terminal', icon: <FaTerminal size={28} /> },
  { id: 'settings', name: 'Settings', icon: <IoMdSettings size={28} /> },
  // <-- Add Doom
  { id: 'finder', name: 'Finder', icon: <FaFolderOpen size={28} /> },
  { id: 'contact', name: 'Contact', icon: <MdEmail size={28} /> },
];

const Dock = ({ openApp }: DockProps) => {
  return (
    <footer className="w-full flex justify-center mb-2 px-2"> {/* Add horizontal padding */}
      <div className="flex flex-wrap justify-center items-end gap-2 md:gap-3 p-2  {/* Use gap for spacing */}
                    bg-white/10 backdrop-blur-xl border border-white/20 
                    rounded-2xl shadow-lg">
        {apps.map((app) => (
          <div key={app.id} className="group relative" onClick={() => openApp(app.id)}> {/* Add relative for tooltip */}
            {/* 
              Responsive icon sizing:
              - Mobile: w-12 h-12 (48px)
              - Desktop (md and up): w-14 h-14 (56px)
            */}
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center cursor-pointer 
                          transition-all duration-300 ease-in-out
                          group-hover:scale-110 group-hover:-translate-y-2">
              {app.icon}
            </div>
            {/* Tooltip for desktop only */}
            <span className="hidden md:block absolute bottom-20 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white 
                           bg-gray-800/80 backdrop-blur-md rounded-md
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {app.name}
            </span>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default Dock;