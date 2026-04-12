import type { Metadata } from "next";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: "Contact",
  description: "Contact page coming soon.",
});

const Contact = async () => (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <h1 className="font-semibold text-3xl">Contact</h1>
    <p className="mt-4 text-muted-foreground">
      Contact form is temporarily simplified while we stabilize the web app.
    </p>
  </main>
);

export default Contact;
