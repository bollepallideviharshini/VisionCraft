import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, ArrowUp, Square, RectangleHorizontal, RectangleVertical, Settings2, Lightbulb } from "lucide-react";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", icon: Square },
  { label: "16:9", value: "16:9", icon: RectangleHorizontal },
  { label: "9:16", value: "9:16", icon: RectangleVertical },
];

const QUANTITY_OPTIONS = [1, 2, 4];

const STYLES = [
  "Cinematic", "Macro", "Minimalist", "Pop Art",
  "Cyberpunk", "Wes Anderson", "Bird's Eye View", "Gothic",
];

const INSPIRATION_CHIPS = [
  { label: "Cyberpunk City", prompt: "A futuristic cyberpunk cityscape at night with neon lights and rain" },
  { label: "Macro Nature", prompt: "An extreme macro photograph of a dewdrop on a flower petal at golden hour" },
  { label: "Film Noir", prompt: "A moody film noir scene with dramatic shadows and a mysterious figure" },
  { label: "Surreal Dream", prompt: "A surreal dreamscape with floating islands and impossible architecture" },
  { label: "Wes Anderson", prompt: "A symmetrical scene in Wes Anderson style with pastel colors and quirky details" },
  { label: "Gothic", prompt: "A dark gothic cathedral interior with stained glass windows and dramatic lighting" },
];

interface ChatPromptBarProps {
  onGenerate: (prompt: string, aspectRatio: string, style: string, quantity: number) => void;
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
  const [quantity, setQuantity] = useState(1);
  const [showInspiration, setShowInspiration] = useState(false);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim(), aspectRatio, selectedStyle, quantity);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chipPrompt: string) => {
    setPrompt(chipPrompt);
    setShowInspiration(false);
  };

  return (
    <div className="border-t border-border/20 bg-background/60 backdrop-blur-2xl">
      <div className="mx-auto max-w-[700px] px-4 py-3 space-y-2">
        {/* Inspiration chips row */}
        {showInspiration && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {INSPIRATION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.prompt)}
                className="shrink-0 rounded-full border border-border/40 bg-secondary/40 px-3 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Main input row */}
        <div className="relative flex items-end gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1 pb-[10px]">
            {/* Settings popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-64 rounded-lg border border-border/40 bg-card p-3 shadow-lg"
              >
                <div className="space-y-3">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Aspect Ratio
                  </p>
                  <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5">
                    {ASPECT_RATIOS.map((ar) => (
                      <button
                        key={ar.value}
                        onClick={() => setAspectRatio(ar.value)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
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

                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Quantity
                  </p>
                  <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5">
                    {QUANTITY_OPTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuantity(q)}
                        className={`flex flex-1 items-center justify-center rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          quantity === q
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {q} {q === 1 ? "image" : "images"}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Style
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {STYLES.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(selectedStyle === style ? "" : style)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors border ${
                          selectedStyle === style
                            ? "border-foreground/30 bg-foreground/10 text-foreground"
                            : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>

                  {/* Active selections summary */}
                  {(aspectRatio !== "1:1" || selectedStyle || quantity > 1) && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">Active:</span>
                      {aspectRatio !== "1:1" && (
                        <span className="text-[10px] font-mono text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                          {aspectRatio}
                        </span>
                      )}
                      {quantity > 1 && (
                        <span className="text-[10px] font-mono text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                          ×{quantity}
                        </span>
                      )}
                      {selectedStyle && (
                        <span className="text-[10px] font-mono text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                          {selectedStyle}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Inspiration toggle */}
            <button
              onClick={() => setShowInspiration(!showInspiration)}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                showInspiration
                  ? "bg-secondary/80 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
            </button>
          </div>

          {/* Text input */}
          <Textarea
            placeholder="Describe an image or just say hi..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-lg border-border/30 bg-secondary/30 px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
            disabled={isGenerating}
            rows={1}
          />

          {/* Right controls */}
          <div className="flex items-center gap-1.5 pb-[10px]">
            {guestCreditsRemaining !== undefined && guestCreditsMax !== undefined && (
              <Badge
                variant={guestCreditsRemaining > 0 ? "secondary" : "destructive"}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md"
              >
                {guestCreditsRemaining}/{guestCreditsMax}
              </Badge>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              className="h-9 w-9 shrink-0 rounded-lg bg-foreground text-background hover:bg-foreground/90"
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
    </div>
  );
}
