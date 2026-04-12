import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Blog",
  description: "Blog coming soon.",
});

const BlogIndex = async () => (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <h1 className="font-semibold text-3xl">Blog</h1>
    <p className="mt-4 text-muted-foreground">Blog content is coming soon.</p>
  </main>
);

export default BlogIndex;
