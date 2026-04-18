"use client";

import { cn } from "@repo/design-system/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CtaProps {
  dictionary: {
    cta: {
      title: string;
      subtitle: string;
      installCommand: string;
      copyCommand: string;
    };
  };
}

export function Cta({ dictionary }: CtaProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dictionary.cta.installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard API is not available
    }
  };

  return (
    <section className="px-4 py-[100px] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1056px]">
        <div className="rounded-[29px] bg-[#F2F2F2] px-[71px] py-[100px] text-center">
          {/* Title */}
          <h2 className="mb-6 font-bold text-[42px] text-black">
            {dictionary.cta.title}
          </h2>

          {/* Install command pill */}
          <button
            className={cn(
              "mb-4 inline-flex cursor-pointer items-center gap-3 rounded-full px-5 py-3 transition-colors",
              "bg-[#0F0F0F] hover:bg-[#2A2A2A]"
            )}
            onClick={handleCopy}
            type="button"
          >
            <span className="font-medium text-[#666] text-[14px]">$</span>
            <code className="font-medium text-[14px] text-white">
              {dictionary.cta.installCommand}
            </code>
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-[#666]" />
            )}
          </button>

          {/* Copy command link */}
          <button
            className="text-[#666] text-[14px] underline underline-offset-4 transition-colors hover:text-black"
            onClick={handleCopy}
            type="button"
          >
            {dictionary.cta.copyCommand}
          </button>
        </div>
      </div>
    </section>
  );
}
