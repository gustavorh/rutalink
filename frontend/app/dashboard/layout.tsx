"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getUser, logout } from "@/lib/auth";
import {
  DashboardSidebar,
  DashboardHeader,
  DashboardFooter,
} from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    // This is the standard pattern for preventing hydration issues in Next.js
    // See: https://nextjs.org/docs/messages/react-hydration-error
    setMounted(true); // eslint-disable-line
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  const user = getUser();
  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-ui-surface-elevated overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        currentPath={pathname}
        onNavigate={(path) => router.push(path)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <DashboardHeader user={user} onLogout={handleLogout} />

        {/* Page Content */}
        {children}

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}
