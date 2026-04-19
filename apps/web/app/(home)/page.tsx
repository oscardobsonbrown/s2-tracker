import type { Metadata } from "next";
import Link from "next/link";
import { CobeGlobe } from "./components/cobe-globe";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "next-ship",
  description:
    "A production-ready Next.js starter with auth, payments, database, analytics, and security ready to go.",
});

const Home = async () => (
  <main className="min-h-[100dvh] overflow-hidden">
    <section className="mx-auto flex min-h-[calc(100dvh-1px)] max-w-7xl flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:justify-between lg:gap-16 lg:py-24">
      <div className="flex max-w-2xl flex-col items-start">
        <h1 className="max-w-[720px] text-balance font-semibold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          Find the best snow in the world, every time.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-8">
          Fresh snow is rare. Bad timing is optional. Find the mountains about
          to turn on.
        </p>
        <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-4 sm:justify-start">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
            href="/docs"
          >
            Join Waitlist
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 font-medium text-sm transition-colors hover:bg-muted"
            href="/contact"
          >
            Learn more
          </Link>
        </div>
      </div>

      <div className="relative flex aspect-square w-full max-w-[520px] items-center justify-center">
        <CobeGlobe className="h-full w-full" />
      </div>
    </section>
  </main>
);

export default Home;
