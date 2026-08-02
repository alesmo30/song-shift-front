import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className={styles.track}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-testid={`tab-${tab.id}`}
          className={`${styles.tab} ${tab.id === activeId ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
