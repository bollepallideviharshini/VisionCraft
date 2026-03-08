import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ArrowUp } from "lucide-react";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

const STYLES = [
  "Cinematic", "Macro", "Minimalist", "Pop Art",
  "Cyberpunk", "Wes Anderson", "Bird's Eye View", "Gothic",
];

interface ChatPromptBarProps {
  onGenerate: (prompt: string, aspectRatio: string, style: string) => void;
  isGenerating: boolean;
  initialPrompt?: string;
  guestCreditsRemaining?: number;
  guestCreditsMax?: number;
}

export default function ChatPromptBar({
  onGenerate,
  isGenerating,
  initialPrompt,
  guestCreditsRemaining,
  guestCreditsMax,
}: ChatPromptBarProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("");

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), aspectRatio, selectedStyle);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl px-4 py-3 space-y-3">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Aspect ratio toggles */}
          <div className="flex items-center gap-1 rounded-lg bg-secondary/40 p-0.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  aspectRatio === ar.value
                    ? "gradient-bg text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>

          {/* Style chips */}
          <div className="flex flex-wrap gap-1">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(selectedStyle === style ? "" : style)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all border ${
                  selectedStyle === style
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Credits badge */}
          {guestCreditsRemaining !== undefined && guestCreditsMax !== undefined && (
            <Badge
              variant={guestCreditsRemaining > 0 ? "secondary" : "destructive"}
              className="ml-auto text-[11px] px-2.5 py-0.5"
            >
              {guestCreditsRemaining}/{guestCreditsMax} credits
            </Badge>
          )}
        </div>

        {/* Input row */}
        <div className="relative flex items-end gap-2">
          <Textarea
            placeholder="Describe the image you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] max-h-[120px] resize-none rounded-xl border-border/40 bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 backdrop-blur-sm"
            disabled={isGenerating}
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="h-[48px] w-[48px] shrink-0 rounded-xl gradient-bg glow"
            size="icon"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
