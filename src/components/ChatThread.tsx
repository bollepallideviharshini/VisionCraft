import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Share2, RefreshCw, Grid2x2, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
  aspectRatio?: string;
  style?: string;
  timestamp: Date;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  onRegenerate?: (messageId: string, prompt: string, aspectRatio?: string, style?: string) => void;
  onVariations?: (messageId: string, prompt: string, aspectRatio?: string, style?: string) => void;
}

export default function ChatThread({ messages, onRegenerate, onVariations }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inpaintingId, setInpaintingId] = useState<string | null>(null);

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

  const handleInpainting = (msgId: string) => {
    setInpaintingId(inpaintingId === msgId ? null : msgId);
    toast({ title: "Coming Soon", description: "Selection & inpainting will be available in a future update." });
  };

  // Find the user message that corresponds to an assistant message
  const findUserMsgForAssistant = (assistantIndex: number): ChatMessage | undefined => {
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i];
    }
    return undefined;
  };

  return (
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
              <div className="rounded-md border border-[hsl(var(--ai-bubble-border))] bg-[hsl(var(--ai-bubble))] overflow-hidden">
                {msg.isGenerating ? (
                  <div className="flex flex-col">
                    <Progress value={65} className="h-0.5 rounded-none bg-muted [&>div]:bg-foreground/40" />
                    <div className="flex h-56 items-center justify-center">
                      <p className="text-xs text-muted-foreground font-mono tracking-wide">
                        generating...
                      </p>
                    </div>
                  </div>
                ) : msg.imageUrl ? (
                  <>
                    <div className="relative group">
                      <img
                        src={msg.imageUrl}
                        alt={msg.prompt}
                        className="w-full object-contain"
                        loading="lazy"
                      />
                      {/* Inpainting overlay placeholder */}
                      {inpaintingId === msg.id && (
                        <div className="absolute inset-0 bg-foreground/5 flex items-center justify-center">
                          <div className="rounded-md bg-card border border-border px-4 py-3 text-center">
                            <MousePointer2 className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                            <p className="text-xs font-mono text-muted-foreground">Selection tool coming soon</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[hsl(var(--ai-bubble-border))]">
                      <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[40%]">
                        {msg.prompt}
                      </p>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Select area"
                          onClick={() => handleInpainting(msg.id)}
                        >
                          <MousePointer2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyPrompt(msg.prompt)}
                          title="Copy prompt"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleShare(msg.imageUrl!, msg.prompt)}
                          title="Share"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = msg.imageUrl!;
                            a.download = "visioncraft.png";
                            a.click();
                          }}
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Regenerate & Variations buttons */}
              {msg.imageUrl && !msg.isGenerating && (
                <div className="flex items-center gap-1.5 pl-1">
                  {onRegenerate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => {
                        const userMsg = findUserMsgForAssistant(i);
                        onRegenerate(msg.id, msg.prompt, userMsg?.aspectRatio, userMsg?.style);
                      }}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </Button>
                  )}
                  {onVariations && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5"
                      onClick={() => {
                        const userMsg = findUserMsgForAssistant(i);
                        onVariations(msg.id, msg.prompt, userMsg?.aspectRatio, userMsg?.style);
                      }}
                    >
                      <Grid2x2 className="h-3 w-3" />
                      4 Variations
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
