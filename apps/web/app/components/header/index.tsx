"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { Dictionary } from "@/lib/dictionary";

export function Header({ dictionary }: { dictionary: Dictionary }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-medium text-xl">
              {dictionary.header.logo}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-8">
            <a
              className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              href="/docs"
            >
              {dictionary.header.docs}
            </a>
            <a
              aria-label="Source code on GitHub"
              className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
              href="https://github.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              {dictionary.header.source}
              <svg
                aria-hidden="true"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </a>
            <Button
              className="rounded-full bg-black px-4 text-white hover:bg-black/90"
              size="sm"
              variant="default"
            >
              {dictionary.header.copyAgentPrompt}
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
