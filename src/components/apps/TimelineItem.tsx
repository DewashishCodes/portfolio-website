// src/components/apps/TimelineItem.tsx
import { ExperienceEntry } from '@/data/experienceData';

const TimelineItem = ({ entry }: { entry: ExperienceEntry }) => {
  return (
    <div className="relative pl-8 sm:pl-32 py-6 group">
      {/* Vertical line */}
      <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-gray-600 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-blue-400 after:border-4 after:box-content after:border-gray-700 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
        <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-28 h-6 mb-3 sm:mb-0 text-gray-200 bg-gray-700 rounded-full">
          {entry.duration}
        </time>
        <div className="text-xl font-bold text-white">{entry.role}</div>
      </div>
      <div className="text-gray-300 ml-0 sm:ml-36">
        <p className="font-semibold text-gray-100">{entry.company}</p>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
          {entry.responsibilities.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TimelineItem;