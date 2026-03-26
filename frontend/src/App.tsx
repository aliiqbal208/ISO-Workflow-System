import { useState } from 'react';
import ComponentsPanel from './features/components/ComponentsPanel';
import WorkflowBuilder from './features/workflows/WorkflowBuilder';
import ApplicationTracker from './features/applications/ApplicationTracker';
import { getStorageItem, setStorageItem } from './utils/storage';
import type { ComponentType } from 'react';

interface Tab {
  id: string;
  label: string;
  component: ComponentType;
}

const TABS: Tab[] = [
  { id: 'components', label: '📦 Components', component: ComponentsPanel },
  { id: 'workflows', label: '🔧 Workflow Builder', component: WorkflowBuilder },
  { id: 'applications', label: '📊 Applications', component: ApplicationTracker },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = getStorageItem<string>('active_tab', 'components');
    return TABS.some((t) => t.id === saved) ? saved : 'components';
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setStorageItem('active_tab', tabId);
  };

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <header className="text-center mb-8 py-7 px-5 bg-gradient-to-br from-primary via-violet-500 to-violet-400 text-white rounded-2xl shadow-[0_4px_20px_rgba(99,102,241,0.3)] relative overflow-hidden">
        <div className="absolute -top-1/2 -right-[20%] w-[300px] h-[300px] bg-white/[0.08] rounded-full" />
        <div className="absolute -bottom-[40%] -left-[10%] w-[200px] h-[200px] bg-white/[0.05] rounded-full" />
        <h1 className="text-3xl font-bold mb-1.5 relative z-10">🏛️ ISO Workflow System</h1>
        <p className="opacity-90 text-[0.95rem] font-normal relative z-10">
          Multi-Organization Certification Workflow Management
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 py-2.5 px-5 border-none rounded-lg text-sm font-medium text-center transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'text-white bg-primary shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                : 'text-slate-500 bg-transparent hover:text-primary hover:bg-primary-light'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
