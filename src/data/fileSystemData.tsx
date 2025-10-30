// src/data/fileSystemData.tsx

import { ReactElement } from 'react';
import { FaFilePdf, FaFolder, FaCode, FaBriefcase, FaTrophy } from 'react-icons/fa';

import { projectsData } from './projectsData';
import { experienceData } from './experienceData';
import { hackathonsData } from './hackathonsData';

export interface File {
  name: string;
  type: 'file';
  meta: {
    icon: ReactElement;
    appId: string;
  };
}

export interface Folder {
  name: string;
  type: 'folder';
  children: readonly (File | Folder)[];
  meta: {
    icon: ReactElement;
  };
}

export type FileSystemNode = File | Folder;

// --- HELPER FUNCTION: This is the new, robust solution ---
function createReadonlyFiles<T>(
  data: readonly T[], 
  transform: (item: T) => File
): readonly File[] {
  return data.map(transform);
}

// This structure defines our entire file system
export const fileSystem = {
  '/': {
    name: 'root',
    type: 'folder',
    children: [
      {
        name: 'Desktop',
        type: 'folder',
        meta: { icon: <FaFolder size={40} className="text-blue-400" /> },
        children: [],
      },
      {
        name: 'Documents',
        type: 'folder',
        meta: { icon: <FaFolder size={40} className="text-blue-400" /> },
        children: [
          {
            name: 'resume.pdf',
            type: 'file',
            meta: { icon: <FaFilePdf size={40} className="text-red-400" />, appId: 'resume' },
          },
        ],
      },
      {
        name: 'Projects',
        type: 'folder',
        meta: { icon: <FaFolder size={40} className="text-blue-400" /> },
        // Use the helper function to ensure the correct readonly type
        children: createReadonlyFiles(projectsData, (project) => ({
          name: `${project.title.replace(/ /g, '-')}.proj`,
          type: 'file',
          meta: {
            icon: <FaCode size={40} className="text-green-400" />,
            appId: 'projects',
          },
        })),
      },
      {
        name: 'Experience',
        type: 'folder',
        meta: { icon: <FaFolder size={40} className="text-blue-400" /> },
        children: createReadonlyFiles(experienceData, (exp) => ({
          name: `${exp.company.replace(/ /g, '-')}.exp`,
          type: 'file',
          meta: {
            icon: <FaBriefcase size={40} className="text-yellow-400" />,
            appId: 'experience',
          },
        })),
      },
      {
        name: 'Hackathons',
        type: 'folder',
        meta: { icon: <FaFolder size={40} className="text-purple-400" /> },
        children: createReadonlyFiles(hackathonsData, (hack) => ({
          name: `${hack.name.replace(/ /g, '-')}.hack`,
          type: 'file',
          meta: {
            icon: <FaTrophy size={40} className="text-purple-400" />,
            appId: 'hackathons',
          },
        })),
      },
    ],
  },
} as const;