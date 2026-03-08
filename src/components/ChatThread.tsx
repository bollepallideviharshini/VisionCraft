import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col gap-6 pb-4">
      {messages.map((msg, i) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i === messages.length - 1 ? 0.1 : 0 }}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="max-w-[80%] md:max-w-[65%] rounded-2xl rounded-br-md bg-primary/15 border border-primary/20 px-5 py-3 backdrop-blur-sm">
              <p className="text-sm text-foreground leading-relaxed">{msg.prompt}</p>
              {msg.style && (
                <span className="mt-1.5 inline-block text-[11px] text-muted-foreground">
                  Style: {msg.style} · {msg.aspectRatio}
                </span>
              )}
            </div>
          ) : (
            <div className="max-w-[85%] md:max-w-[70%] space-y-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-bg">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">VisionCraft</span>
              </div>

              <div className="rounded-2xl rounded-bl-md border border-border/50 bg-card/50 overflow-hidden backdrop-blur-sm">
                {msg.isGenerating ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full gradient-bg animate-pulse" />
                        <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-primary-foreground animate-spin" />
                      </div>
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Crafting your vision...
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
                    <div className="flex items-center justify-between p-3 border-t border-border/30">
                      <p className="text-[11px] text-muted-foreground truncate max-w-[70%]">
                        {msg.prompt}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = msg.imageUrl!;
                          a.download = "visioncraft-image.png";
                          a.click();
                        }}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
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
