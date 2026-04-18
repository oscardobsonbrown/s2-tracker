import type { Dictionary } from "@/lib/dictionary";

interface HeroProps {
  dictionary: Dictionary;
}

export const Hero = ({ dictionary }: HeroProps) => {
  return (
    <section className="w-full px-4 pt-16 pb-20">
      <div className="mx-auto max-w-[1512px]">
        {/* Title */}
        <h1 className="mb-6 text-center font-bold text-[67px] leading-[1.1] tracking-tight">
          {dictionary.hero.title}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-[860px] text-center text-lg text-muted-foreground leading-relaxed">
          {dictionary.hero.subtitle}
        </p>

        {/* Install Command */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3 text-white">
            <span className="text-sm opacity-50">$</span>
            <code className="font-medium text-sm">
              {dictionary.hero.installCommand}
            </code>
          </div>
          <button
            className="text-foreground text-sm underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
            type="button"
          >
            {dictionary.hero.agentPrompt}
          </button>
        </div>

        {/* User Avatars */}
        <div className="mb-12 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div
              className="h-[54px] w-[54px] overflow-hidden rounded-full bg-muted ring-2 ring-background"
              // biome-ignore lint/suspicious/noArrayIndexKey: avatars are static with intentional stacking order
              key={i}
              style={{ marginLeft: i > 0 ? "-12px" : "0", zIndex: 5 - i }}
            >
              <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-400" />
            </div>
          ))}
        </div>

        {/* Images */}
        <div className="relative mx-auto max-w-[1397px]">
          {/* Main landscape image */}
          <div className="mx-auto mb-4 max-w-[1397px] overflow-hidden rounded-[20px]">
            <div className="aspect-[1397/645] w-full bg-gradient-to-br from-gray-100 to-gray-300" />
          </div>

          {/* Web page screenshot - positioned over the landscape image */}
          <div className="absolute -bottom-[15%] left-1/2 mx-auto w-[964px] max-w-[90%] -translate-x-1/2 overflow-hidden rounded-[10px] shadow-2xl">
            <div className="aspect-[964/590] w-full bg-gradient-to-br from-gray-200 to-gray-400" />
          </div>
        </div>

        {/* Spacer for the overlapping image */}
        <div className="h-[180px]" />
      </div>
    </section>
  );
};
