"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Inbox,
  Package,
  Users,
  Radio,
  BrainCircuit,
  Settings,
  FileText,
  HelpCircle,
  Database,
  Building,
  Tag,
  StickyNote,
  Sparkles,
  Search,
} from "lucide-react";
import type { SearchResultItem } from "@/server/services/globalSearch.service";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        //
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    setQuery("");
    command();
  };

  const getItemIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "client":
        return <Users className="mr-2 h-4 w-4 text-brand-lime" />;
      case "brand":
        return <Building className="mr-2 h-4 w-4 text-blue-500" />;
      case "sku":
        return <Package className="mr-2 h-4 w-4 text-purple-500" />;
      case "order":
        return <Tag className="mr-2 h-4 w-4 text-amber-500" />;
      case "note":
        return <StickyNote className="mr-2 h-4 w-4 text-emerald-500" />;
      case "memory":
        return <Sparkles className="mr-2 h-4 w-4 text-pink-500" />;
      default:
        return <Search className="mr-2 h-4 w-4 text-ink-muted" />;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search clients, brands, orders, notes, memory bank (Cmd+K)..."
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching workspace..." : "No matching results found."}
        </CommandEmpty>

        {/* Global Search Results */}
        {searchResults.length > 0 && (
          <CommandGroup heading={`Search Results (${searchResults.length})`}>
            {searchResults.map((item) => (
              <CommandItem
                key={`${item.type}-${item.id}`}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex items-center justify-between"
              >
                <div className="flex items-center min-w-0">
                  {getItemIcon(item.type)}
                  <span className="font-medium text-ink truncate mr-2">{item.title}</span>
                  <span className="text-[11px] text-ink-muted truncate font-mono">
                    {item.subtitle}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-muted text-ink-subtle">
                  {item.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.length > 0 && <CommandSeparator />}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/inbox"))}>
            <Inbox className="mr-2 h-4 w-4" />
            <span>Customer Inbox</span>
            <CommandShortcut>G I</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/orders"))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Orders Matrix</span>
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/customers"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Clients &amp; Brands</span>
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/channels"))}>
            <Radio className="mr-2 h-4 w-4" />
            <span>Channels &amp; Import</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/memory"))}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            <span>Customer Memory Bank</span>
            <CommandShortcut>G M</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Company Brain &amp; Settings</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System &amp; Architecture">
          <CommandItem onSelect={() => runCommand(() => router.push("/how-we-built"))}>
            <Database className="mr-2 h-4 w-4" />
            <span>Our Inspiration Story (/how-we-built)</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => router.push("/dev/components"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Design System Catalog (/dev/components)</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
