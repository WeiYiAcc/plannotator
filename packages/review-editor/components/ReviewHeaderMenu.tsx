import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@plannotator/ui/components/ThemeProvider';

interface ReviewHeaderMenuProps {
  isPanelOpen: boolean;
  annotationCount: number;
  onTogglePanel: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export const ReviewHeaderMenu: React.FC<ReviewHeaderMenuProps> = ({
  isPanelOpen,
  annotationCount,
  onTogglePanel,
  onOpenSettings,
  onOpenExport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedMode, setTheme } = useTheme();
  const activeTheme = useMemo<'light' | 'dark'>(() => {
    return theme === 'system' ? resolvedMode : theme;
  }, [resolvedMode, theme]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(open => !open)}
        className={`flex items-center gap-1.5 p-1.5 md:px-2.5 md:py-1 rounded-md text-xs font-medium transition-colors ${
          isOpen
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
        title="Options"
        aria-label="Options"
        aria-expanded={isOpen}
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
        <span className="hidden md:inline">Options</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 rounded-lg border border-border bg-popover py-1 shadow-xl z-[70]">
          <MenuItem
            onClick={() => handleAction(onTogglePanel)}
            icon={<AnnotationsIcon />}
            label={isPanelOpen ? 'Hide Annotations' : 'Show Annotations'}
            badge={annotationCount > 0 ? annotationCount : undefined}
          />

          <div className="my-1 border-t border-border" />

          <div className="px-3 py-2 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleAction(() => setTheme(mode))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeTheme === mode
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'light' ? <SunIcon /> : <MoonIcon />}
                  <span className="capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 border-t border-border" />

          <MenuItem
            onClick={() => handleAction(onOpenSettings)}
            icon={<SettingsIcon />}
            label="Settings"
          />
          <MenuItem
            onClick={() => handleAction(onOpenExport)}
            icon={<ExportIcon />}
            label="Export"
          />
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge !== undefined && (
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        {badge}
      </span>
    )}
  </button>
);

const MenuIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AnnotationsIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25M12 18.75V21M3 12h2.25M18.75 12H21M5.636 5.636l1.591 1.591M16.773 16.773l1.591 1.591M5.636 18.364l1.591-1.591M16.773 7.227l1.591-1.591" />
    <circle cx="12" cy="12" r="3.25" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3c-.18.57-.21 1.19-.21 1.82A8 8 0 0019.18 13c.63 0 1.25-.03 1.82-.21z" />
  </svg>
);
