import React from 'react';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root-container min-h-screen bg-[#f3f3f9] dark:bg-[#141824] text-slate-800 dark:text-slate-100">
      {children}
    </div>
  );
}
