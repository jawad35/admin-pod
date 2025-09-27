import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "./sidebar";
import TopBar from "./topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          data-testid="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar 
          onMenuClick={() => setSidebarOpen(true)}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
