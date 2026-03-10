import type { ReactNode } from 'react';

export interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur">
        {children}
      </div>
    </div>
  );
};

