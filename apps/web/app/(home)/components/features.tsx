import type { ReactNode } from "react";

interface FeaturesProps {
  children: ReactNode;
}

export const Features = ({ children }: FeaturesProps) => (
  <section className="w-full px-4 py-16">
    <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-2">
      {children}
    </div>
  </section>
);
