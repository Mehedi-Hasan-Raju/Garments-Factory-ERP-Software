"use client";

import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import UserProfileMenu from "@/components/layout/user-profile-menu";


interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
 
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <span>Workspace</span>
          <span>/</span>
          <span className="font-semibold text-foreground">Dashboard</span>
        </div>

        <div className="sm:hidden">
          <p className="text-sm font-semibold">Dashboard</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 md:flex lg:w-64">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
            /
          </kbd>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell size={19} />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-destructive" />
        </button>

        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        <UserProfileMenu />
      </div>
    </header>
  );
}
