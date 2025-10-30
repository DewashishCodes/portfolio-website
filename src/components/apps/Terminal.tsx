import React, { useState, useRef, useEffect } from 'react';
import { projectsData } from '@/data/projectsData'; // Import your project data

type HistoryItem = {
  command: string;
  output: React.ReactNode;
};

// A small component for the command prompt string
const Prompt = () => (
  <>
    <span className="text-blue-400">guest@portfolio-os</span>
    <span className="text-gray-400">:</span>
    <span className="text-green-400">~</span>
    <span className="text-gray-400">$ </span>
  </>
);

const WelcomeBanner = () => (
  // New Welcome Banner: A simple, tech-themed `CODE` logo.
  <pre className="text-blue-400">
    {`
  +-----------------+
  |  ████╗  ██╗       |
  |  ██  ██ ██║       |
  |  ██  ██ ██║       |
  |  ████╔╝ ███████╗  |
  +-----------------+
          `}
    <p className="text-sm text-gray-300 -mt-2">Welcome to my Portfolio OS Terminal.</p>
    <p className="text-sm text-gray-300">Type 'help' to see a list of available commands.</p>
  </pre>
);

const Terminal = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- COMMANDS DEFINITION ---
  const commands: { [key: string]: (args: string[]) => React.ReactNode } = {
    help: () => (
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        <div className="font-bold">Core Commands</div><div></div>
        <div>whoami</div><div>Display user information.</div>
        <div>projects</div><div>List my main projects.</div>
        <div>contact</div><div>Show contact information.</div>
        <div>clear</div><div>Clear the terminal history.</div>
        <div className="font-bold mt-2">Fun Commands</div><div></div>
        <div>ls</div><div>List "files" in the current directory.</div>
        <div>cat [file]</div><div>Display content of a "file".</div>
        <div>neofetch</div><div>Display system information.</div>
        <div>sudo</div><div>Request admin privileges.</div>
      </div>
    ),
    whoami: () => "You are 'guest', a curious visitor exploring this digital realm.",
    projects: () => (
      <div>
        <p>Here are some of my key projects. Open the 'Projects' app for more detail.</p>
        <ul className="list-disc pl-5 mt-2">
          {projectsData.map(p => <li key={p.id}>{p.title}</li>)}
        </ul>
      </div>
    ),
    contact: () => (
      <span>
        You can reach me at <a href="mailto:business.dewashishlambore@gmail.com" className="text-blue-400 hover:underline">business.dewashishlambore.com</a> or via the LinkedIn icon on the desktop.
      </span>
    ),
    clear: () => {
      setHistory([]);
      return null;
    },
    ls: () => (
      <div className="flex space-x-4">
        <span className="text-blue-400">about.txt</span>
        <span className="text-blue-400">projects.txt</span>
        <span className="text-blue-400">contact.txt</span>
      </div>
    ),
    cat: (args: string[]) => {
      const file = args[0];
      if (!file) return "Usage: cat [filename]. Try 'cat projects.txt'.";
      switch (file) {
        case 'about.txt':
          return "I'm a passionate developer who loves crafting unique digital experiences. This portfolio is one of them!";
        case 'projects.txt':
          return `I have worked on several projects, including: ${projectsData.map(p => p.title).join(', ')}.`;
        case 'contact.txt':
          return "You can contact me via the 'Contact' app or the links on the desktop.";
        default:
          return `cat: ${file}: No such file or directory`;
      }
    },
    neofetch: () => (
      // New Neofetch: Uses a circuit/chip logo.
      <div className="flex gap-4">
        <pre className="text-blue-400">
        {`
      .======.
      |  ()  |
   .--'------'--.
   |   .----.   |
   |   |    |   |
   |   '----'   |
   '--.------.--'
      |  ||  |
      '==||=='
        `}
        </pre>
        <div className="text-sm">
          <p><span className="text-blue-400 font-bold">guest@portfolio-os</span></p>
          <p>--------------------</p>
          <p><span className="text-blue-400 font-bold">OS</span>: DL-OS v1.0</p>
          <p><span className="text-blue-400 font-bold">Host</span>: Your Browser</p>
          <p><span className="text-blue-400 font-bold">Kernel</span>: Next.js / React</p>
          <p><span className="text-blue-400 font-bold">Shell</span>: Faux-bash</p>
          <p><span className="text-blue-400 font-bold">Resolution</span>: Your screen size</p>
          <p><span className="text-blue-400 font-bold">Theme</span>: Dark Ether</p>
          <p><span className="text-blue-400 font-bold">CPU</span>: You (The awesome visitor)</p>
        </div>
      </div>
    ),
    sudo: () => "User 'guest' is not in the sudoers file. This incident will be reported.",
  };
  // --- END COMMANDS ---

  useEffect(() => {
    inputRef.current?.focus();
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      const [command, ...args] = trimmedInput.split(' ');
      const newHistoryItem: HistoryItem = { command: trimmedInput, output: '' };
      
      if (commands[command]) {
        newHistoryItem.output = commands[command](args);
      } else {
        newHistoryItem.output = `Command not found: ${command}. Type 'help' for a list of commands.`;
      }
      
      if (command !== 'clear') {
        setHistory([...history, newHistoryItem]);
      }
      setCommandHistory(prev => [trimmedInput, ...prev]);
      setHistoryIndex(-1);
      setInput('');

    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) {
        setInput(commandHistory[newIndex]);
      }
      
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex] || '');
    }
  };

  return (
    <div 
      className="w-full h-full bg-black/80 font-mono text-sm text-green-400 p-2 overflow-y-auto"
      onClick={() => inputRef.current?.focus()}
    >
      <WelcomeBanner />
      {history.map((item, index) => (
        <div key={index}>
          <div className="flex items-center">
            <Prompt />
            <p className="flex-1">{item.command}</p>
          </div>
          {item.output && <div className="mt-1 mb-2 text-gray-300">{item.output}</div>}
        </div>
      ))}
      <div className="flex items-center">
        <Prompt />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none text-green-400 w-full focus:outline-none"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
      <div ref={scrollRef} />
    </div>
  );
};

export default Terminal;