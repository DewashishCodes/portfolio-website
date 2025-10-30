// src/data/experienceData.ts
export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  duration: string;
  responsibilities: string[];
}

export const experienceData: ExperienceEntry[] = [
  {
    id: 'exp1',
    role: 'Artificial Intelligence Intern',
    company: 'SCAAI,Pune,India',
    duration: 'July 2025-Present',
    responsibilities: [
      'Automated end-to-end machine learning workflows using Airflow and Docker, improving efficiency and reliability in financial data processing pipelines.',
'Optimized and managed ML infrastructure on AWS and Azure, enhancing scalability, deployment consistency, and overall system performance.',
'Collaborated with data science and DevOps teams to monitor, evaluate, and refine model performance, ensuring secure and compliant AI integration within fintech systems.',

    ],
  },
  {
    id: 'exp2',
    role: 'Freelance Fullstack Developer',
    company: 'Self-Employed',
    duration: 'August 2024-Present',
    responsibilities: [
      'Developed and maintained full-stack web applications and CLI tools used by over a thousand users, delivering reliable solutions for academic and productivity use cases.',
'Led end-to-end development of projects such as MyClass@SIT, an officially launched college platform, along with ScopusViz, OCRForge, and TestIn10.',
'Implemented robust APIs, optimized database performance, and deployed scalable systems, ensuring smooth user experience and maintainable codebases across multiple projects.',


    ],
  },


  // Add more of your experience here
];