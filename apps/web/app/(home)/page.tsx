import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "next-ship",
  description: "A basic Next.js starter page.",
});

const Home = async () => (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <h1 className="font-semibold text-3xl">next-ship web</h1>
    <p className="mt-4 text-muted-foreground">
      This page is intentionally minimal for now. We can expand it later.
    </p>
  </main>
);

export default Home;
