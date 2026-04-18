import type { Metadata } from "next";

interface BlogPostProperties {
  readonly params: Promise<{
    slug: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: BlogPostProperties): Promise<Metadata> => {
  const { slug } = await params;
  return {
    title: `Blog: ${slug}`,
    description: "Blog post placeholder.",
  };
};

export const generateStaticParams = async (): Promise<{ slug: string }[]> => [];

const BlogPost = async ({ params }: BlogPostProperties) => {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-semibold text-3xl">Blog Post</h1>
      <p className="mt-4 text-muted-foreground">
        Placeholder page for <code>{slug}</code>.
      </p>
    </main>
  );
};

export default BlogPost;
