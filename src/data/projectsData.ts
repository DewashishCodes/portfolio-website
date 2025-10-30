// src/data/projectsData.ts

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  imageUrl: string;
  liveUrl?: string;
  repoUrl?: string;
}

export const projectsData: Project[] = [
  {
    id: 'p1',
    title: 'Attores Studio',
    description:
      'An AI-first Python code editor built to revolutionize how developers learn programming. Features real-time AI assistance, intelligent debugging, and natural language-to-code conversion for an interactive learning experience.',
    techStack: ['React', 'TypeScript', 'Vite', 'Shadcn UI', 'Monaco Editor', 'OpenAI API'],
    imageUrl: '/images/attores.png',
    liveUrl: 'https://attores.netlify.app/',
    repoUrl: 'https://github.com/DewashishCodes/Attores-Studio',
  },
  {
    id: 'p2',
    title: 'OCRForge CLI',
    description:
      'A command-line productivity tool combining OCR, LLMs, and text-to-speech. Allows users to extract text from images or screen snippets, query it using local or cloud LLMs, and receive spoken responses — blending accessibility with AI-driven assistance.',
    techStack: ['Python', 'Tesseract', 'OpenAI API', 'Groq', 'Gemini', 'pyttsx3'],
    imageUrl: '/images/ocrforge.png',
    repoUrl: 'https://github.com/DewashishCodes/OCR-Forge-CLI',
  },
  {
    id: 'p3',
    title: 'ScopusViz',
    description:
      'A data visualization dashboard designed for the HOD of Electronics and Telecommunication, SIT Pune, to analyze and present Scopus publication data with clarity and actionable insights.',
    techStack: ['React', 'TypeScript', 'Python', 'Flask', 'Chart.js'],
    imageUrl: '/images/scopusviz.png',
  },
  {
    id: 'p4',
    title: 'TESTin10',
    description:
      'An AI-powered EdTech platform developed for the 2Fast2Hack Hackathon by Google DSC SIT. Generates personalized assessments, provides performance analysis, and offers adaptive learning paths for students.',
    techStack: ['React', 'TypeScript', 'Flask', 'OpenAI API', 'Tailwind CSS'],
    imageUrl: '/images/tin10.jpg',
  },
  {
    id: 'p5',
    title: 'Agentic RAG System',
    description:
      'A resilient, multi-modal Retrieval-Augmented Generation (RAG) system developed for HackRx 6.0. Built with an agentic routing layer to handle text, spreadsheet, and image data with GPU-accelerated reranking and asynchronous task handling.',
    techStack: ['Python', 'FastAPI', 'LangChain', 'Docker', 'asyncio', 'OpenAI API'],
    imageUrl: '/images/rag.jpg',
  },
  {
    id: 'p6',
    title: 'Interactive OS Portfolio',
    description: 'A unique, OS-themed portfolio inspired by macOS and Arch Linux. It features a fully interactive, multi-window desktop environment where users can drag windows, change wallpapers, and use custom-built "apps" like a fake terminal. Built from scratch to be fast, responsive, and memorable.',
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'React Icons'],
    imageUrl: '/images/os.png', // <-- You need to take a screenshot of your finished portfolio and save it here
    repoUrl: 'https://github.com/your-username/your-portfolio-repo', // <-- IMPORTANT: Change this to your actual GitHub repo link
    liveUrl: 'https://your-live-portfolio-url.com', // <-- IMPORTANT: Add this after you deploy the site
  },
];
