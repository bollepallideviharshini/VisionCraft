import { motion } from "framer-motion";
import { Download, Share, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  imageUrl: string | null;
  isGenerating: boolean;
  prompt: string;
  onTogglePublic?: () => void;
  isPublic?: boolean;
}

export default function ImagePreview({
  imageUrl,
  isGenerating,
  prompt,
  onTogglePublic,
  isPublic,
}: ImagePreviewProps) {
  if (!imageUrl && !isGenerating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden backdrop-blur-sm">
        {isGenerating ? (
          <div className="flex h-80 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full gradient-bg animate-pulse" />
                <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-primary-foreground animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">
                Crafting your vision...
              </p>
            </div>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={prompt}
              className="w-full object-contain"
              loading="lazy"
            />
            <div className="flex items-center justify-between p-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground truncate max-w-[60%]">{prompt}</p>
              <div className="flex gap-2">
                {onTogglePublic && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onTogglePublic}
                    className={isPublic ? "text-primary" : "text-muted-foreground"}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    {isPublic ? "Public" : "Private"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = imageUrl;
                    a.download = "visioncraft-image.png";
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
