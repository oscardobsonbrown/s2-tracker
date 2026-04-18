import type { Dictionary } from "@/lib/dictionary";

interface AIAgentsProps {
  dictionary: Dictionary;
}

export const AIAgents = ({ dictionary }: AIAgentsProps) => {
  const icons = [
    { name: "context", color: "#8B5CF6" },
    { name: "docs", color: "#3B82F6" },
    { name: "rules", color: "#10B981" },
    { name: "agents", color: "#F59E0B" },
    { name: "ai", color: "#EF4444" },
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
          {dictionary.features.agents.title}
        </h3>
        <p className="max-w-[340px] text-muted-foreground text-sm leading-relaxed">
          {dictionary.features.agents.description}
        </p>
      </div>
    </div>
  );
};
