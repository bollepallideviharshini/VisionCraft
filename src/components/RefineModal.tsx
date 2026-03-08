import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Paintbrush, MousePointer2, ToggleLeft, ToggleRight, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface RefineModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  onRefine: (editPrompt: string) => void;
  isRefining: boolean;
  refinedImageUrl?: string;
}

export default function RefineModal({
  open,
  onClose,
  imageUrl,
  prompt,
  onRefine,
  isRefining,
  refinedImageUrl,
}: RefineModalProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [activeTool, setActiveTool] = useState<"select" | "brush" | null>(null);
  const [showAfter, setShowAfter] = useState(false);

  const handleToolClick = (tool: "select" | "brush") => {
    setActiveTool(activeTool === tool ? null : tool);
    toast({
      title: "Coming Soon",
      description: "Inpainting is coming soon to VisionCraft Pro!",
    });
  };

  const handleSubmit = () => {
    if (!editPrompt.trim() || isRefining) return;
    onRefine(editPrompt.trim());
    setEditPrompt("");
    setShowAfter(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const displayedImage = showAfter && refinedImageUrl ? refinedImageUrl : imageUrl;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25 }}
            className="relative flex flex-col w-[95vw] max-w-[720px] max-h-[90vh] rounded-md border border-border/60 bg-card overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-medium text-foreground">Refine</h2>

                {/* Tools */}
                <div className="flex items-center gap-0.5 rounded-md bg-secondary/60 p-0.5">
                  <button
                    onClick={() => handleToolClick("select")}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      activeTool === "select"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MousePointer2 className="h-3 w-3" />
                    Select
                  </button>
                  <button
                    onClick={() => handleToolClick("brush")}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      activeTool === "brush"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Paintbrush className="h-3 w-3" />
                    Brush
                  </button>
                </div>

                {/* Before / After toggle */}
                {refinedImageUrl && (
                  <button
                    onClick={() => setShowAfter(!showAfter)}
                    className="flex items-center gap-1.5 rounded-md border border-border/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAfter ? (
                      <ToggleRight className="h-3.5 w-3.5 text-foreground" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5" />
                    )}
                    {showAfter ? "After" : "Before"}
                  </button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Image area */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-background/60 p-4 min-h-0">
              <div className="relative rounded-md overflow-hidden border border-border/30">
                <img
                  src={displayedImage}
                  alt={prompt}
                  className="max-w-full max-h-[55vh] object-contain"
                />
                {/* Brush/Select cursor overlay */}
                {activeTool && (
                  <div
                    className="absolute inset-0"
                    style={{ cursor: activeTool === "brush" ? "crosshair" : "cell" }}
                    onClick={() =>
                      toast({
                        title: "Coming Soon",
                        description: "Inpainting is coming soon to VisionCraft Pro!",
                      })
                    }
                  />
                )}
                {isRefining && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-mono">refining...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt caption */}
            <div className="px-4 pt-2">
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {prompt}
              </p>
            </div>

            {/* Edit with text input */}
            <div className="px-4 py-3">
              <div className="relative flex items-end gap-2">
                <Textarea
                  placeholder="Describe an edit... e.g. 'make the sky sunset'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[44px] max-h-[100px] resize-none rounded-md border-border/40 bg-secondary/40 px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/20 focus-visible:ring-offset-0"
                  disabled={isRefining}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!editPrompt.trim() || isRefining}
                  className="h-[44px] w-[44px] shrink-0 rounded-md bg-foreground text-background hover:bg-foreground/90"
                  size="icon"
                >
                  {isRefining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
