import type { Dictionary } from "@/lib/dictionary";

type AIEditorsProps = {
  dictionary: Dictionary;
};

export const AIEditors = ({ dictionary }: AIEditorsProps) => {
  const icons = [
    { name: "cursor", color: "#000000" },
    { name: "copilot", color: "#6B7280" },
    { name: "claude", color: "#D97706" },
    { name: "zed", color: "#6366F1" },
    { name: "windsurf", color: "#10B981" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Icons row */}
      <div className="flex items-center gap-3">
        {icons.map((icon) => (
          <div
            className="h-16 w-16 overflow-hidden rounded-full bg-muted"
            key={icon.name}
            style={{ backgroundColor: `${icon.color}15` }}
          >
            <div
              className="h-full w-full"
              style={{ backgroundColor: icon.color, opacity: 0.2 }}
            />
          </div>
        ))}
      </div>

      {/* Title and description */}
      <div className="flex flex-col gap-2">
        <h3 className="font-medium text-lg tracking-tight">
          {dictionary.features.editors.title}
        </h3>
        <p className="max-w-[340px] text-muted-foreground text-sm leading-relaxed">
          {dictionary.features.editors.description}
        </p>
      </div>
    </div>
  );
};
