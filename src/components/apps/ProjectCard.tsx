// src/components/apps/ProjectCard.tsx
import { Project } from '@/data/projectsData';
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa';

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 flex flex-col transition-transform hover:scale-[1.02] hover:border-gray-600">
      <img src={project.imageUrl} alt={project.title} className="w-full h-40 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="text-lg font-bold">{project.title}</h4>
        <p className="text-sm text-gray-300 mt-1 flex-grow">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.techStack.map(tech => (
            <span key={tech} className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded-full">
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-4 pt-2 border-t border-gray-700 flex items-center space-x-4">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:underline">
              <FaExternalLinkAlt className="mr-2" />
              Live Demo
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 hover:underline">
              <FaGithub className="mr-2" />
              Source Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;