import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { current: number; total: number; onChange: (p: number) => void; }

export const Pagination: React.FC<Props> = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onChange(current - 1)} disabled={current === 1} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={20} /></button>
      <span className="text-gray-400 text-sm">{current} / {total}</span>
      <button onClick={() => onChange(current + 1)} disabled={current === total} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 disabled:opacity-30"><ChevronRight size={20} /></button>
    </div>
  );
};
