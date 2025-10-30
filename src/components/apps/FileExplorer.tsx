// src/components/apps/FileExplorer.tsx
import React, { useState } from 'react';
import { fileSystem, FileSystemNode } from '@/data/fileSystemData';
import { FaDesktop, FaFolder, FaBriefcase, FaTrophy } from 'react-icons/fa';

type FileExplorerProps = {
  openApp: (appId: string) => void;
};

const FileExplorer = ({ openApp }: FileExplorerProps) => {
  // Default to showing the Documents folder's contents
  const [currentDirectory, setCurrentDirectory] = useState<readonly FileSystemNode[]>(
    fileSystem['/'].children[1].children
  );
  const [activeSidebarItem, setActiveSidebarItem] = useState('Documents');

  // --- UPDATED to include all our new auto-generated folders ---
  const sidebarLocations = [
    { name: 'Desktop', icon: <FaDesktop />, path: fileSystem['/'].children[0].children },
    { name: 'Documents', icon: <FaFolder />, path: fileSystem['/'].children[1].children },
    { name: 'Projects', icon: <FaFolder />, path: fileSystem['/'].children[2].children },
    { name: 'Experience', icon: <FaBriefcase />, path: fileSystem['/'].children[3].children },
    { name: 'Hackathons', icon: <FaTrophy />, path: fileSystem['/'].children[4].children },
  ];

  const handleDoubleClick = (node: FileSystemNode) => {
    if (node.type === 'folder') {
      alert("Folder navigation is a future feature!");
    } else if (node.type === 'file') {
      openApp(node.meta.appId);
    }
  };

  const handleSidebarClick = (name: string, path: readonly FileSystemNode[]) => {
    setCurrentDirectory(path);
    setActiveSidebarItem(name);
  };

  return (
    <div className="w-full h-full flex bg-gray-800/50">
      <aside className="w-48 bg-gray-900/40 p-2 flex-shrink-0">
        <h3 className="font-bold text-gray-400 px-2 mb-2">Favorites</h3>
        <ul>
          {sidebarLocations.map(loc => (
            <li key={loc.name}>
              <button
                onClick={() => handleSidebarClick(loc.name, loc.path)}
                className={`w-full flex items-center space-x-2 px-2 py-1 rounded text-left
                            ${activeSidebarItem === loc.name ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                {loc.icon}
                <span>{loc.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
          {currentDirectory.length > 0 ? (
            currentDirectory.map((node) => (
              <div
                key={node.name}
                className="flex flex-col items-center justify-start text-center cursor-pointer p-2 rounded-lg hover:bg-white/10"
                onDoubleClick={() => handleDoubleClick(node)}
              >
                {node.meta.icon}
                <span className="mt-2 text-xs text-white break-words w-full">{node.name}</span>
              </div>
            ))
          ) : (
            <p className="col-span-full text-gray-500">This folder is empty.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default FileExplorer;