// src/components/apps/DoomWindow.tsx
"use client"; // Good practice for components using browser-specific elements

export default function DoomWindow() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <iframe
        src="https://dos.zone/doom-dec-1993"
        title="DOOM"
        className="w-full h-full border-none"
        allowFullScreen
      />
    </div>
  );
}