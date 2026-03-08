import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, Share2, RefreshCw, Grid2x2, Wand2, Brush, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  prompt: string;
  imageUrl?: string;
  imageUrls?: string[];
  /** For progressive loading: total slots expected */
  imageSlots?: number;
  textResponse?: string;
  isGenerating?: boolean;
  generatingLabel?: string;
  aspectRatio?: string;
  style?: string;
  timestamp: Date;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  onRegenerate?: (messageId: string, prompt: string, aspectRatio?: string, style?: string) => void;
  onVariations?: (messageId: string, prompt: string, aspectRatio?: string, style?: string) => void;
  onRefine?: (messageId: string, imageUrl: string, prompt: string) => void;
}

const ASPECT_RATIO_CLASS: Record<string, string> = {
  "1:1": "aspect-square",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

const STATUS_STEPS = [
  "Analyzing prompt...",
  "Painting your vision...",
  "Upscaling for clarity...",
];

function SkeletonLoader({ aspectRatio, generatingLabel }: { aspectRatio?: string; generatingLabel?: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const aspectClass = ASPECT_RATIO_CLASS[aspectRatio || "1:1"] || "aspect-square";

  useEffect(() => {
    // If a custom label is set externally, don't auto-cycle
    if (generatingLabel && !STATUS_STEPS.includes(generatingLabel)) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STATUS_STEPS.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [generatingLabel]);

  const displayLabel = generatingLabel && !STATUS_STEPS.includes(generatingLabel)
    ? generatingLabel
    : STATUS_STEPS[stepIndex];

  return (
    <div className="rounded-md border border-border/20 overflow-hidden">
      {/* Glowing progress bar */}
      <div className="h-[2px] w-full bg-muted progress-glow" />

      {/* Skeleton area */}
      <div className={`skeleton-shimmer ${aspectClass} max-h-[400px] flex flex-col items-center justify-center gap-3`}>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 pulse-dot" />
          <AnimatePresence mode="wait">
            <motion.p
              key={displayLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-muted-foreground font-mono tracking-wide"
            >
              {displayLabel}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STATUS_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-500 ${
                idx <= stepIndex
                  ? "w-4 bg-foreground/30"
                  : "w-1 bg-foreground/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CrossFadeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Skeleton behind until loaded */}
      {!loaded && (
        <div className={`skeleton-shimmer ${className} bg-muted`} />
      )}
      <motion.img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? "" : "absolute inset-0"}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

export default function ChatThread({ messages, onRegenerate, onVariations, onRefine }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({ title: "Copied", description: "Prompt copied to clipboard." });
  };

  const handleShare = (imageUrl: string, prompt: string) => {
    if (navigator.share) {
      navigator.share({ title: "VisionCraft", text: prompt, url: imageUrl });
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast({ title: "Link copied", description: "Image URL copied to clipboard." });
    }
  };

  const handleDownload = (imageUrl: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "visioncraft.png";
    a.click();
  };

  const findUserMsgForAssistant = (assistantIndex: number): ChatMessage | undefined => {
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i];
    }
    return undefined;
  };

  const renderImageGrid = (urls: string[], prompt: string, msgId: string, totalSlots?: number) => {
    const total = totalSlots || urls.length;
    const cols = total === 1 ? "grid-cols-1" : "grid-cols-2";
    const items: (string | null)[] = [...urls];
    // Fill remaining slots with null (skeleton placeholders)
    while (items.length < total) items.push(null);

    return (
      <div className={`grid ${cols} gap-1`}>
        {items.map((url, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-sm">
            {url ? (
              <>
                <CrossFadeImage
                  src={url}
                  alt={`${prompt} - ${idx + 1}`}
                  className="w-full object-cover aspect-square"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-0.5 pb-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => handleDownload(url)} title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => setExpandedImage(url)} title="Expand">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                    {onRefine && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" onClick={() => onRefine(msgId, url, prompt)} title="Refine">
                        <Wand2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="skeleton-shimmer aspect-square flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/50 pulse-dot" />
                  <span className="text-[10px] text-muted-foreground font-mono">Generating...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSingleImage = (msg: ChatMessage, i: number) => (
    <>
      <div className="rounded-md border border-[hsl(var(--ai-bubble-border))] bg-[hsl(var(--ai-bubble))] overflow-hidden">
        <CrossFadeImage
          src={msg.imageUrl!}
          alt={msg.prompt}
          className="w-full object-contain"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-[hsl(var(--ai-bubble-border))]">
          <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[40%]">
            {msg.prompt}
          </p>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleCopyPrompt(msg.prompt)} title="Copy prompt">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleShare(msg.imageUrl!, msg.prompt)} title="Share">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleDownload(msg.imageUrl!)} title="Download">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-1">
        {onRefine && (
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5" onClick={() => onRefine(msg.id, msg.imageUrl!, msg.prompt)}>
            <Wand2 className="h-3 w-3" /> Refine
          </Button>
        )}
        {onRegenerate && (
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5" onClick={() => { const u = findUserMsgForAssistant(i); onRegenerate(msg.id, msg.prompt, u?.aspectRatio, u?.style); }}>
            <RefreshCw className="h-3 w-3" /> Regenerate
          </Button>
        )}
        {onVariations && (
          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5" onClick={() => { const u = findUserMsgForAssistant(i); onVariations(msg.id, msg.prompt, u?.aspectRatio, u?.style); }}>
            <Grid2x2 className="h-3 w-3" /> 4 Variations
          </Button>
        )}
      </div>
    </>
  );

  // Find the aspect ratio from the preceding user message for a generating assistant message
  const getAspectForMsg = (msgIndex: number): string | undefined => {
    const userMsg = findUserMsgForAssistant(msgIndex);
    return userMsg?.aspectRatio;
  };

  return (
    <>
      <div className="flex flex-col gap-5 pb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.08 : 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[75%] md:max-w-[60%] rounded-md bg-[hsl(var(--user-bubble))] px-4 py-3">
                <p className="text-sm font-mono text-[hsl(var(--user-bubble-foreground))] leading-relaxed">
                  {msg.prompt}
                </p>
                {msg.style && (
                  <span className="mt-1 inline-block text-[11px] text-[hsl(var(--user-bubble-foreground)/0.5)]">
                    {msg.style} · {msg.aspectRatio}
                  </span>
                )}
              </div>
            ) : (
              <div className="max-w-[80%] md:max-w-[70%] space-y-1.5">
                {/* Text-only chat response */}
                {msg.textResponse && !msg.imageUrl && !msg.imageUrls && !msg.isGenerating && (
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/60 mt-0.5">
                      <Brush className="h-3.5 w-3.5 text-accent-foreground" />
                    </div>
                    <div className="rounded-md border border-border/30 bg-white px-4 py-3">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {msg.textResponse}
                      </p>
                    </div>
                  </div>
                )}

                {/* Multi-image grid (including progressive loading) */}
                {msg.imageUrls && msg.imageUrls.length > 0 && (
                  <>
                    <div className="rounded-md border border-[hsl(var(--ai-bubble-border))] bg-[hsl(var(--ai-bubble))] overflow-hidden">
                      {renderImageGrid(msg.imageUrls, msg.prompt, msg.id, msg.imageSlots)}
                      <div className="flex items-center justify-between px-3 py-2 border-t border-[hsl(var(--ai-bubble-border))]">
                        <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[50%]">
                          {msg.prompt}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {msg.imageUrls.length}{msg.imageSlots ? `/${msg.imageSlots}` : ""} images
                        </span>
                      </div>
                    </div>
                    {!msg.isGenerating && (
                      <div className="flex items-center gap-1.5 pl-1">
                        {onRegenerate && (
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5" onClick={() => { const u = findUserMsgForAssistant(i); onRegenerate(msg.id, msg.prompt, u?.aspectRatio, u?.style); }}>
                            <RefreshCw className="h-3 w-3" /> Regenerate
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Generating state with no images yet — skeleton loader */}
                {msg.isGenerating && (!msg.imageUrls || msg.imageUrls.length === 0) && (
                  <SkeletonLoader
                    aspectRatio={getAspectForMsg(i)}
                    generatingLabel={msg.generatingLabel}
                  />
                )}

                {/* Single image */}
                {!msg.isGenerating && msg.imageUrl && !msg.imageUrls && !msg.textResponse && (
                  renderSingleImage(msg, i)
                )}
              </div>
            )}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Expanded image dialog */}
      <Dialog open={!!expandedImage} onOpenChange={() => setExpandedImage(null)}>
        <DialogContent className="max-w-4xl p-0 border-border/40 bg-card overflow-hidden">
          {expandedImage && (
            <img src={expandedImage} alt="Expanded" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
