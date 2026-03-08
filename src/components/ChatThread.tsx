import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Share2 } from "lucide-react";
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
}

export default function ChatThread({ messages }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
                    <img
                      src={msg.imageUrl}
                      alt={msg.prompt}
                      className="w-full object-contain"
                      loading="lazy"
                    />
                    <div className="flex items-center justify-between px-3 py-2 border-t border-[hsl(var(--ai-bubble-border))]">
                      <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[55%]">
                        {msg.prompt}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopyPrompt(msg.prompt)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleShare(msg.imageUrl!, msg.prompt)}
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
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
