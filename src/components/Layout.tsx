import type { ReactNode } from 'react';
import { ModeBar } from './ModeBar';

export interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-8 transition-colors">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-text)] shadow-sm transition-colors">
        <ModeBar />
        {children}
      </div>
    </div>
  );
};
