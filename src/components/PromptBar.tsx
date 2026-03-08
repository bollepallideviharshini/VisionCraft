import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const ASPECT_RATIOS = [
  { label: "1:1", value: "1:1", desc: "Square" },
  { label: "16:9", value: "16:9", desc: "Wide" },
  { label: "9:16", value: "9:16", desc: "Story" },
];

const STYLES = [
  "Cinematic", "Macro", "Minimalist", "Pop Art",
  "Cyberpunk", "Wes Anderson", "Bird's Eye View", "Gothic",
];

interface PromptBarProps {
  onGenerate: (prompt: string, aspectRatio: string, style: string) => void;
  isGenerating: boolean;
  initialPrompt?: string;
}

export default function PromptBar({ onGenerate, isGenerating, initialPrompt }: PromptBarProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("");

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt.trim(), aspectRatio, selectedStyle);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      {/* Prompt input */}
      <div className="relative gradient-border rounded-2xl">
        <Textarea
          placeholder="Describe the image you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] resize-none rounded-2xl border-0 bg-card/60 p-4 pr-14 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 backdrop-blur-sm"
          disabled={isGenerating}
        />
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="absolute bottom-3 right-3 rounded-xl gradient-bg glow"
          size="icon"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Aspect Ratio */}
        <div className="flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              onClick={() => setAspectRatio(ar.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
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
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(selectedStyle === style ? "" : style)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                selectedStyle === style
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
