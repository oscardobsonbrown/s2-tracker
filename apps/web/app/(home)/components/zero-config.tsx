"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/dictionary";

interface ZeroConfigProps {
  dictionary: Dictionary;
}

type TabKey = "lint" | "auth" | "email" | "analytics" | "payments" | "security";

const tabContent: Record<TabKey, { title: string; code: string }> = {
  lint: {
    title: "Biome",
    code: `// biome.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "lineWidth": 80
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}`,
  },
  auth: {
    title: "NextAuth.js",
    code: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };`,
  },
  email: {
    title: "Resend",
    code: `// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string) {
  return resend.emails.send({
    from: "onboarding@yourdomain.com",
    to,
    subject,
  });
}`,
  },
  analytics: {
    title: "PostHog",
    code: `// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}`,
  },
  payments: {
    title: "Polar.sh",
    code: `// lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER ?? "sandbox",
});

export async function listProducts() {
  return polar.products.list();
}`,
  },
  security: {
    title: "Arcjet",
    code: `// middleware.ts
import arcjet, { createMiddleware, detectBot } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [detectBot({ mode: "LIVE" })],
});

export default createMiddleware(aj);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};`,
  },
};

export const ZeroConfig = ({ dictionary }: ZeroConfigProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("lint");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "lint", label: dictionary.zeroConfig.tabs.lint },
    { key: "auth", label: dictionary.zeroConfig.tabs.auth },
    { key: "email", label: dictionary.zeroConfig.tabs.email },
    { key: "analytics", label: dictionary.zeroConfig.tabs.analytics },
    { key: "payments", label: dictionary.zeroConfig.tabs.payments },
    { key: "security", label: dictionary.zeroConfig.tabs.security },
  ];

  return (
    <section className="w-full px-4 py-16">
      <div className="mx-auto max-w-[1200px]">
        {/* Title and description */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="mb-4 font-medium text-2xl tracking-tight md:text-3xl">
            {dictionary.zeroConfig.title}
          </h2>
          <p className="max-w-[600px] text-muted-foreground leading-relaxed">
            {dictionary.zeroConfig.description}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {tabs.map((tab) => (
            <button
              className={`rounded-full px-4 py-2 font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code preview */}
        <div className="overflow-hidden rounded-[20px] border border-border bg-[#1a1a1a]">
          <div className="flex items-center gap-2 border-white/10 border-b px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-white/50 text-xs">
              {tabContent[activeTab].title}
            </span>
          </div>
          <div className="overflow-x-auto p-4">
            <pre className="font-mono text-sm text-white/90">
              <code>{tabContent[activeTab].code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
