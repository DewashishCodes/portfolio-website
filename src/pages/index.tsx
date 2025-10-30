// src/pages/index.tsx

import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { AnimatePresence } from 'framer-motion';

// --- Icon Imports ---
import { FaFilePdf } from 'react-icons/fa';
import { SiGithub, SiLinkedin } from 'react-icons/si'; 

// --- Data Imports ---
import { projectsData } from '@/data/projectsData';
import { experienceData } from '@/data/experienceData';
import { hackathonsData } from '@/data/hackathonsData';

// --- Component Imports ---
import TopBar from '@/components/TopBar';
import Dock from '@/components/Dock';
import Window from '@/components/Window';
import BootScreen from '@/components/BootScreen';
import ProjectCard from '@/components/apps/ProjectCard';
import TimelineItem from '@/components/apps/TimelineItem';

// --- App Component Imports ---
import Terminal from '@/components/apps/Terminal';
import Settings from '@/components/apps/Settings'; // Keep this if you want Tetris, or remove it

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [isBooting, setIsBooting] = useState(true);
  const [openApps, setOpenApps] = useState<string[]>([]);
  const [wallpaper, setWallpaper] = useState('./images/wallpaper-milkyway.jpg'); // Default wallpaper
  const desktopRef = useRef<HTMLElement | null>(null);

  // --- APP & ICON DEFINITIONS ---
  const appContent: { [key: string]: React.ReactNode } = {
    about: (
      <div className="flex flex-col md:flex-row items-center gap-8 p-6 overflow-y-auto h-full">
        <img 
          src="/images/profile.jpeg" 
          alt="A photo of me" 
          className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-gray-600 flex-shrink-0"
        />
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-3xl font-bold">Hello! I'm Dewashish Lambore</h3>
          <p className="mt-2 text-gray-300 leading-relaxed">
            I'm a creative software developer with a love for building elegant software solutions,
            I love to make products that will bring value to a user's life — simple,
            efficient, and user-friendly applications. This OS-style portfolio is a testament
            to my joy in crafting unique digital experiences.
          </p>
          <div className="mt-6">
            <h4 className="text-xl font-semibold mb-3">Core Skills</h4>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'Tailwind CSS','Machine Learning','Generative AI','Communication','Leadership'].map(skill => (
                <span key={skill} className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    projects: (
      <div className="h-full overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4 p-4 sticky top-0 bg-gray-900/30 backdrop-blur-sm z-10">My Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
          {projectsData.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      </div>
    ),
    experience: (
      <div className="h-full overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4 p-4 sticky top-0 bg-gray-900/30 backdrop-blur-sm z-10">Work Experience</h3>
        <div className="p-4">{experienceData.map(entry => <TimelineItem key={entry.id} entry={entry} />)}</div>
      </div>
    ),
    hackathons: (
      <div className="h-full overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4 p-4 sticky top-0 bg-gray-900/30 backdrop-blur-sm z-10">Hackathons & Competitions</h3>
        <div className="space-y-6 p-4">
          {hackathonsData.map(hack => (
            <div key={hack.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-bold">{hack.name}</h4>
                  <p className="text-sm text-gray-400">{hack.date}</p>
                </div>
                {hack.award && <span className="bg-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full">{hack.award}</span>}
              </div>
              <p className="mt-2 text-gray-300">{hack.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hack.techStack.map(tech => <span key={tech} className="text-xs bg-gray-700 px-2 py-1 rounded-full">{tech}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    contact: (
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-4">Get In Touch</h3>
        <p>You can reach me via email at <a href="mailto:business.dewashishlambore@gmail.com" className="text-blue-400 hover:underline">business.dewashishlambore@gmail.com</a> or connect with me on LinkedIn or Github.</p>
      </div>
    ),
    resume: <div className="w-full h-full"><iframe src="/resume.pdf" width="100%" height="100%" title="Resume" /></div>,
    terminal: <Terminal />,
    settings: <Settings currentWallpaper={wallpaper} setCurrentWallpaper={setWallpaper} />,// If you ditched Tetris, remove this line
  };

  const appTitles: { [key: string]: string } = {
    about: "About Me", projects: "Projects", experience: "Experience", hackathons: "Hackathons",
    contact: "Contact", resume: "My Resume", terminal: "Terminal", settings: "System Settings",
    tetris: "Tetris", // And this line
  };

  const desktopIcons = [
    { id: 'resume', name: 'Resume.pdf', icon: <FaFilePdf size={40} className="text-red-400" />, type: 'app' },
    { id: 'github', name: 'My GitHub', icon: <SiGithub size={40} />, type: 'link', url: 'https://github.com/DewashishCodes' },
    {
      id: 'linkedin',
      name: 'My LinkedIn',
      icon: <SiLinkedin size={40} className="text-blue-500" />, // Added a nice brand color
      type: 'link',
      url: 'https://www.linkedin.com/in/dewashish-lambore-927048318/' // <-- IMPORTANT: Change this URL
    }
  ];

  // --- EFFECTS ---
  useEffect(() => {
  // --- CHANGE THE DURATION HERE ---
  const bootTimer = setTimeout(() => {
    setIsBooting(false);
    openApp('about');
  }, 2500); // Changed from 5500 to 2500 milliseconds (2.5 seconds)
  
  return () => clearTimeout(bootTimer);
}, []);

  // --- HANDLER FUNCTIONS ---
  const handleIconClick = (icon: typeof desktopIcons[0]) => {
    if (icon.type === 'app') openApp(icon.id);
    else if (icon.type === 'link' && icon.url) window.open(icon.url, '_blank', 'noopener,noreferrer');
  };

  const openApp = (appId: string) => {
    setOpenApps(currentApps => {
      if (!currentApps.includes(appId)) return [...currentApps, appId];
      return [...currentApps.filter(id => id !== appId), appId];
    });
  };

  const closeApp = (appId: string) => setOpenApps(currentApps => currentApps.filter(id => id !== appId));

  const focusApp = (appId: string) => {
    setOpenApps(currentApps => {
      if (currentApps.at(-1) === appId) return currentApps;
      return [...currentApps.filter(id => id !== appId), appId];
    });
  };

  // --- RENDER LOGIC ---
  if (isBooting) {
    return <BootScreen />;
  }

  return (
    <div className="h-screen overflow-hidden font-sans text-white bg-black">
      <Head>
        <title>Dewashish's OS Portfolio</title>
      </Head>

      <div className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${wallpaper})` }} />
      
      <div className="relative z-10 flex flex-col h-full">
        <TopBar activeAppId={openApps.at(-1)} />
        <main ref={desktopRef} className="flex-grow relative">
          <div className="absolute top-12 left-4 grid grid-cols-1 gap-4">
            {desktopIcons.map(icon => (
              <div key={icon.id} className="flex flex-col items-center justify-center text-center w-24 h-24 cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors" onDoubleClick={() => handleIconClick(icon)}>
                {icon.icon}
                <span className="mt-2 text-xs text-white drop-shadow-md">{icon.name}</span>
              </div>
            ))}
          </div>
          <AnimatePresence>
            {openApps.map((appId, index) => (
              <Window key={appId} title={appTitles[appId]} onClose={() => closeApp(appId)} onFocus={() => focusApp(appId)} dragConstraintsRef={desktopRef} zIndex={10 + index}>
                {appContent[appId]}
              </Window>
            ))}
          </AnimatePresence>
        </main>
        <Dock openApp={openApp} />
      </div>
    </div>
  );
}
