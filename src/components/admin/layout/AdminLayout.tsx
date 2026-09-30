'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<{
    id: string;
    email: string;
    name: string;
    totp_enabled: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setAdminUser(data.user);
        }
      })
      .catch((err) => console.error('Error fetching admin profile:', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f3f9] dark:bg-[#141824] text-slate-800 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <AdminHeader
          adminUser={adminUser}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
