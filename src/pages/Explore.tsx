import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicImage {
  id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  created_at: string;
}

export default function Explore() {
  const [images, setImages] = useState<PublicImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicImages();
  }, []);

  const fetchPublicImages = async () => {
    const { data, error } = await supabase
      .from("generated_images")
      .select("id, prompt, image_url, aspect_ratio, style, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) setImages(data as PublicImage[]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Explore <span className="gradient-text">Community</span>
        </h1>
        <p className="mb-8 text-muted-foreground">Discover what others are creating with VisionCraft</p>

        {loading ? (
          <div className="masonry-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="masonry-item h-64 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">No public images yet</p>
            <p className="text-sm">Be the first to share your creation!</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="masonry-item group"
              >
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40">
                  <img
                    src={img.image_url}
                    alt={img.prompt}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-white/80 line-clamp-2 mb-2">{img.prompt}</p>
                      {img.style && (
                        <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                          {img.style}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
