// src/data/hackathonsData.ts
export interface Hackathon {
  id: string;
  name: string;
  date: string;
  description: string;
  techStack: string[];
  award?: string;
  link?: string;
}

export const hackathonsData: Hackathon[] = [
  {
    id: 'hack1',
    name: 'HackRx 6.0',
    date: 'August 2024',
    description:
      'Developed a resilient, multi-modal Agentic RAG system designed to overcome the fragility of traditional RAG architectures. Implemented an intelligent routing layer that delegated tasks to specialized tools for text, spreadsheet, and image data, with GPU-accelerated cross-encoder reranking and offline caching for optimized performance.',
    techStack: ['Python', 'FastAPI', 'LangChain', 'OpenAI API', 'asyncio', 'Docker'],
    award: '🏅 Top 200 out of 46,178 participants',
  },
  {
    id: 'hack2',
    name: '2Fast2Hack (Google DSC SIT)',
    date: 'March 2024',
    description:
      'Built "TESTin10", an AI-powered EdTech platform that generates personalized assessments, tracks performance, and recommends learning paths. Integrated topic-based question generation and adaptive feedback loops for a tailored learning experience.',
    techStack: ['React', 'TypeScript', 'Flask', 'OpenAI API', 'Tailwind CSS'],
    award: '🥈 2nd Place – Runners-Up (EdTech & AI Track)',
  },
  {
    id: 'hack3',
    name: 'BIT BLITZ Hackathon',
    date: 'November 2023',
    description:
      'Participated in a cybersecurity-focused hackathon organized by CodeX SIT and the Cyber Security Club (CBC). Engaged in capture-the-flag challenges and problem-solving tasks that enhanced technical proficiency and teamwork under pressure.',
    techStack: ['Python', 'Linux', 'Networking', 'Cybersecurity'],
  },
];
