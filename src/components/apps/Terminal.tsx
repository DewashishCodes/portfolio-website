// src/components/apps/Terminal.tsx
import React, { useState, useRef, useEffect } from 'react';

type HistoryItem = {
  command: string;
  output: React.ReactNode;
};

const Terminal = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const commands: { [key: string]: (args: string[]) => React.ReactNode } = {
    help: () => (
      <div>
        <p>Available commands:</p>
        <p className="pl-4">'whoami' - Display user information.</p>
        <p className="pl-4">'projects' - List my main projects.</p>
        <p className="pl-4">'date' - Display the current date.</p>
        <p className="pl-4">'clear' - Clear the terminal history.</p>
        <p className="pl-4">'contact' - Show contact information.</p>
      </div>
    ),
    whoami: () => "guest",
    projects: () => "OS Portfolio, E-commerce Backend, Mobile Fitness App. Click the 'Projects' icon for more details!",
    date: () => new Date().toString(),
    contact: () => (
      <span>
        You can reach me at <a href="mailto:your.email@example.com" className="text-blue-400 hover:underline">your.email@example.com</a>
      </span>
    ),
    clear: () => {
      setHistory([]);
      return null; // No output for clear command
    },
  };

  useEffect(() => {
    inputRef.current?.focus();
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedInput = input.trim();
      if (!trimmedInput) return;

      const [command, ...args] = trimmedInput.split(' ');
      let output: React.ReactNode;

      if (commands[command]) {
        output = commands[command](args);
      } else {
        output = `Command not found: ${command}. Type 'help' for a list of commands.`;
      }
      
      const newHistoryItem: HistoryItem = { command: trimmedInput, output };
      if (command !== 'clear') {
        setHistory([...history, newHistoryItem]);
      }
      setInput('');
    }
  };

  return (
    <div 
      className="w-full h-full bg-black/80 font-mono text-sm text-green-400 p-2 overflow-y-auto"
      onClick={() => inputRef.current?.focus()}
    >
      <p>Welcome to Portfolio OS Terminal. Type 'help' for commands.</p>
      {history.map((item, index) => (
        <div key={index}>
          <div className="flex">
            <span className="text-green-600 mr-2">&gt;</span>
            <p>{item.command}</p>
          </div>
          {item.output && <div>{item.output}</div>}
        </div>
      ))}
      <div className="flex">
        <span className="text-green-600 mr-2">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          className="bg-transparent border-none text-green-400 w-full focus:outline-none"
        />
      </div>
      <div ref={scrollRef} />
    </div>
  );
};

export default Terminal;