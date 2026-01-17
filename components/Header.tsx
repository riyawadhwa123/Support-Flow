'use client';

import { UserCircle, Menu, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check sidebar state from localStorage
  useEffect(() => {
    const checkSidebarState = () => {
      const savedState = localStorage.getItem('sidebarCollapsed');
      setIsSidebarCollapsed(savedState === 'true');
    };
    
    checkSidebarState();
    // Listen for storage changes (in case sidebar state changes in another tab)
    globalThis.addEventListener('storage', checkSidebarState);
    // Also check periodically for same-tab changes
    const interval = setInterval(checkSidebarState, 100);
    
    return () => {
      globalThis.removeEventListener('storage', checkSidebarState);
      clearInterval(interval);
    };
  }, []);

  const handleExpandSidebar = () => {
    setIsSidebarCollapsed(false);
    localStorage.setItem('sidebarCollapsed', 'false');
    // Trigger a custom event to notify Sidebar component
    globalThis.dispatchEvent(new Event('sidebarToggle'));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-900 px-6">
      <div className="flex items-center gap-4">
        {isSidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExpandSidebar}
            className="h-8 w-8"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">My Workspace</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <UserCircle className="h-8 w-8" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

