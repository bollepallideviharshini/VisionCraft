import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowUp, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", icon: Square },
  { label: "16:9", value: "16:9", icon: RectangleHorizontal },
  { label: "9:16", value: "9:16", icon: RectangleVertical },
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
    <div className="glass border-t border-border/40">
      <div className="mx-auto max-w-[800px] px-4 py-3 space-y-2.5">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                onClick={() => setAspectRatio(ar.value)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  aspectRatio === ar.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ar.icon className="h-3 w-3" />
                {ar.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(selectedStyle === style ? "" : style)}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium transition-colors border ${
                  selectedStyle === style
                    ? "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {guestCreditsRemaining !== undefined && guestCreditsMax !== undefined && (
            <Badge
              variant={guestCreditsRemaining > 0 ? "secondary" : "destructive"}
              className="ml-auto text-[11px] font-mono px-2.5 py-0.5 rounded-md"
            >
              {guestCreditsRemaining}/{guestCreditsMax}
            </Badge>
          )}
        </div>

        {/* Input */}
        <div className="relative flex items-end gap-2">
          <Textarea
            placeholder="Describe an image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] resize-none rounded-md border-border/40 bg-secondary/40 px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
            disabled={isGenerating}
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="h-[44px] w-[44px] shrink-0 rounded-md bg-foreground text-background hover:bg-foreground/90"
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
