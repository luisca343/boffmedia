'use client';

export interface UsageTabDefinition<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  tabs: ReadonlyArray<UsageTabDefinition<T>>;
  active: T;
  onChange: (tab: T) => void;
}

export function UsageTableTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <div className="flex border-b border-edge">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            active === tab.key
              ? 'text-primary-hover border-b-2 border-primary -mb-px bg-primary/5'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
