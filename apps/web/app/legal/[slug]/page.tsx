import type { Metadata } from "next";

interface LegalPageProperties {
  readonly params: Promise<{
    slug: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: LegalPageProperties): Promise<Metadata> => {
  const { slug } = await params;
  return {
    title: `Legal: ${slug}`,
    description: "Legal page placeholder.",
  };
};

export const generateStaticParams = async (): Promise<{ slug: string }[]> => [];

const LegalPage = async ({ params }: LegalPageProperties) => {
  const { slug } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-semibold text-3xl">Legal</h1>
      <p className="mt-4 text-muted-foreground">
        Placeholder page for <code>{slug}</code>.
      </p>
    </main>
  );
};

export default LegalPage;
