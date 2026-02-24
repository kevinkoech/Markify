"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NotificationBellProps {
  count: number;
}

export function NotificationBell({ count: initialCount }: NotificationBellProps) {
  const [count, setCount] = useState(initialCount);
  const [isOpen, setIsOpen] = useState(false);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/notifications/count");
        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <Link
        href="/dashboard/notifications"
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </div>
  );
}
