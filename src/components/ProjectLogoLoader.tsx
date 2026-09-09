import React from 'react';
import { ShieldAlert, Radio } from 'lucide-react';

interface ProjectLogoLoaderProps {
  message?: string;
  subMessage?: string;
}

export const ProjectLogoLoader: React.FC<ProjectLogoLoaderProps> = ({
  message = 'LOCATING NEAREST SAFE ZONES...',
  subMessage = 'Checking live telemetry, verified bed capacity, and relief corridors'
}) => {
  return (
    <div 
      role="status" 
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      {/* Pulsing/Breathing Logo Visual */}
      <div className="relative mb-6">
        {/* Outer radial glow halo */}
        <div className="absolute inset-0 rounded-3xl bg-[#EA580C]/20 blur-xl animate-ping" style={{ animationDuration: '2s' }} />
        
        {/* Breathing Logo Container */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-2xl animate-logo-breathe border-2 border-white/40">
          <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          
          {/* Beacon indicator badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-[#EA580C] flex items-center justify-center shadow-md">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Project Identity Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#0F172A]">
          RESQ<span className="text-[#EA580C]">TECH</span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#0F172A] text-white">
          Active
        </span>
      </div>

      {/* Message and SubMessage */}
      <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#0F172A] mb-1">
        {message}
      </h3>
      <p className="text-xs text-slate-500 max-w-xs sm:max-w-sm font-medium leading-relaxed">
        {subMessage}
      </p>

      {/* High-speed activity bar */}
      <div className="w-44 h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
        <div 
          className="h-full bg-[#EA580C] rounded-full animate-pulse"
          style={{
            width: '100%',
            animation: 'pulse 1s cubic-bezier(0.16, 1, 0.3, 1) infinite'
          }}
        />
      </div>
    </div>
  );
};
