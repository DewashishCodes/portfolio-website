// src/components/TopBar.tsx
import { useEffect, useState } from 'react';
import { FaApple } from 'react-icons/fa';
import { IoWifi, IoBatteryFull } from 'react-icons/io5';

const appMenus: { [key: string]: string[] } = {
  default: ['File', 'Edit', 'Help'],
  projects: ['File', 'View', 'Go'],
  resume: ['File', 'View', 'Print'],
  about: ['About', 'Help'],
  terminal: ['Shell', 'Edit', 'View'],
  settings: ['Settings', 'View', 'Window'],
  doom: ['Game', 'Options', 'Help'],
  finder: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'], // <-- Add menu for Settings
};

type TopBarProps = {
  activeAppId?: string;
};

const TopBar = ({ activeAppId }: TopBarProps) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    const intervalId = setInterval(updateDateTime, 1000);
    updateDateTime();
    return () => clearInterval(intervalId);
  }, []);

  const getAppName = () => {
    if (!activeAppId) return "Portfolio";
    return activeAppId.charAt(0).toUpperCase() + activeAppId.slice(1);
  };

  const getMenuItems = () => {
    return appMenus[activeAppId || 'default'] || appMenus['default'];
  };

  const MobileBar = () => (
    <div className="flex md:hidden items-center justify-between w-full px-3">
      <span className="font-semibold">{time}</span>
      <div className="flex items-center space-x-2">
        <IoWifi size={16} />
        <span>5G</span>
        <IoBatteryFull size={18} />
      </div>
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 h-8 flex items-center text-sm
                   bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-md">
      <div className="hidden md:flex items-center justify-between w-full px-4">
        <div className="flex items-center space-x-4">
          <FaApple size={18} />
          <span className="font-bold">{getAppName()}</span>
          {getMenuItems().map(item => (
            <span key={item} className="opacity-80 hover:opacity-100 cursor-pointer">{item}</span>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <IoWifi size={18} />
          <IoBatteryFull size={20} />
          <span>{date}</span>
          <span>{time}</span>
        </div>
      </div>
      <MobileBar />
    </nav>
  );
};

export default TopBar;