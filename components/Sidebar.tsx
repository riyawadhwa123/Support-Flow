'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  BookOpen,
  Wrench,
  MessageSquare,
  Phone,
  Send,
  DollarSign,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
  { name: 'Tools', href: '/tools', icon: Wrench },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Phone Numbers', href: '/phone-numbers', icon: Phone },
  { name: 'Finance', href: '/finance', icon: DollarSign },
  { name: 'Outbound', href: '/outbound', icon: Send },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }

    // Listen for toggle events from Header
    const handleToggle = () => {
      const currentState = localStorage.getItem('sidebarCollapsed');
      setIsCollapsed(currentState === 'true');
    };

    globalThis.addEventListener('sidebarToggle', handleToggle);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const currentState = localStorage.getItem('sidebarCollapsed');
      if (currentState !== null) {
        setIsCollapsed(currentState === 'true');
      }
    }, 100);

    return () => {
      globalThis.removeEventListener('sidebarToggle', handleToggle);
      clearInterval(interval);
    };
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-white dark:bg-[#0f0f0f] border-gray-200 dark:border-gray-900 relative transition-all duration-300 ease-in-out overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b transition-all duration-300',
          isCollapsed ? 'justify-center px-0' : 'justify-between px-6'
        )}
      >
        {!isCollapsed && <h1 className="text-xl font-bold text-gray-900 dark:text-white">SupportFlow</h1>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            'h-8 w-8 transition-all duration-300',
            isCollapsed ? 'mx-auto' : ''
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all duration-300',
                isCollapsed
                  ? 'justify-center px-0 py-2'
                  : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-white'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

