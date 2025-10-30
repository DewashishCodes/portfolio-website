// src/components/apps/Settings.tsx
import React from 'react';

// IMPORTANT: Make sure the `url` paths match the filenames in your `public/images` folder.
const wallpapers = [
  { id: 'milkyway', name: '', url: './images/wallpaper-milkyway.jpg' },
  { id: 'void', name: '', url: './images/wallpaper-abstract.jpg' },
  { id: 'luna', name: '', url: './images/wallpaper-mountains.jpg' },
  // Add more wallpapers here if you have them
];

type SettingsProps = {
  currentWallpaper: string;
  setCurrentWallpaper: (url: string) => void;
};

const Settings = ({ currentWallpaper, setCurrentWallpaper }: SettingsProps) => {
  return (
    <div className="p-4">
      <h3 className="text-xl font-bold mb-4">System Settings</h3>
      
      <div className="mt-6">
        <h4 className="text-lg font-semibold border-b border-gray-500 pb-2 mb-4">Desktop Background</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wallpapers.map((wallpaper) => (
            <div 
              key={wallpaper.id} 
              className="cursor-pointer group"
              onClick={() => setCurrentWallpaper(wallpaper.url)}
            >
              <div 
                className={`w-full h-24 bg-cover bg-center rounded-lg border-2 transition-all
                           ${currentWallpaper === wallpaper.url ? 'border-blue-400' : 'border-transparent group-hover:border-gray-400'}`}
                style={{ backgroundImage: `url(${wallpaper.url})` }}
              ></div>
              <p className="text-center text-sm mt-2">{wallpaper.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;