import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { current: number; total: number; onChange: (p: number) => void; }

export const Pagination: React.FC<Props> = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  
  const pages: (number | string)[] = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
  else if (current <= 3) { pages.push(1, 2, 3, 4, '...', total); }
  else if (current >= total - 2) { pages.push(1, '...', total - 3, total - 2, total - 1, total); }
  else { pages.push(1, '...', current - 1, current, current + 1, '...', total); }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button onClick={() => onChange(current - 1)} disabled={current === 1} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30"><ChevronLeft size={18} /></button>
      {pages.map((p, i) => (
        <button key={i} onClick={() => typeof p === 'number' && onChange(p)} disabled={p === '...'} className={`min-w-[36px] h-9 rounded-lg text-sm font-medium ${p === current ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white' : p === '...' ? 'text-gray-500' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>{p}</button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current === total} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30"><ChevronRight size={18} /></button>
    </div>
  );
};
