"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  MessageSquare,
  Package,
  Users,
  BrainCircuit,
  HelpCircle,
  Box,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaceName?: string;
  industry?: string;
  role?: string;
}

const NAV_ITEMS = [
  { name: "Workspace", href: "/workspace", icon: Layers },
  { name: "Inbox & Chats", href: "/inbox", icon: MessageSquare },
  { name: "Order Matrix", href: "/orders", icon: Package },
  { name: "Customers & Memory", href: "/customers", icon: Users },
  { name: "Settings & Company Brain", href: "/settings", icon: BrainCircuit },
];

export function Sidebar({
  workspaceName,
  industry,
  role,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-16 flex-shrink-0 flex flex-col justify-between items-center py-4 select-none z-40 relative">
        {/* Floating Dark Pill Dock Container */}
        <div className="w-14 bg-[#0C0E14] text-white border border-white/10 rounded-3xl shadow-2xl p-2 flex flex-col items-center justify-between h-[92vh] backdrop-blur-xl">
          {/* Top: Logo Squircle */}
          <div className="flex flex-col items-center gap-4 w-full">
            <Link href="/workspace" className="group p-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-lime text-slate-950 shadow-tactile font-display font-extrabold text-sm transition-transform group-hover:scale-105 border border-[#BDE82B]">
                <Box className="w-5 h-5 stroke-[2.5]" />
              </div>
            </Link>

            <div className="w-7 h-[1px] bg-white/10 my-0.5" />

            {/* Nav Items */}
            <nav className="flex flex-col items-center gap-2.5 w-full">
              {NAV_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/workspace" && pathname.startsWith(item.href));

                return (
                  <Tooltip key={`${item.name}-${idx}`}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200 outline-none",
                          isActive
                            ? "bg-brand-lime text-slate-950 shadow-tactile font-bold scale-105"
                            : "text-white/60 hover:text-white hover:bg-white/10 border border-transparent"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="bg-[#0C0E14] text-white border-white/10">
                      <span className="font-semibold text-xs">{item.name}</span>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Bottom Help Icon */}
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/10 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/story"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12} className="bg-[#0C0E14] text-white border-white/10">
                <span className="font-semibold text-xs">Why OrderMind</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
