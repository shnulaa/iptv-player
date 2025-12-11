import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface TabsProps { tabs: string[]; activeTab: string; onChange: (tab: string) => void; }

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => (
  <div className="flex flex-wrap gap-2 p-1 glass rounded-xl">
    {tabs.map((tab) => (
      <button key={tab} onClick={() => onChange(tab)} className={clsx('relative px-4 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white')}>
        {activeTab === tab && <motion.div layoutId="activeTab" className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 rounded-lg" />}
        <span className="relative z-10">{tab}</span>
      </button>
    ))}
  </div>
);
