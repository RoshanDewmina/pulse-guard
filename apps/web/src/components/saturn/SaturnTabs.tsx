'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface SaturnTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function SaturnTabs({ tabs, defaultTab, onChange, className }: SaturnTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="border-b border-[rgba(55,50,47,0.12)]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium font-sans transition-colors relative',
                activeTab === tab.id
                  ? 'text-[#37322F]'
                  : 'text-[rgba(55,50,47,0.60)] hover:text-[rgba(55,50,47,0.80)]'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#37322F]" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">{activeTabContent}</div>
    </div>
  );
}


