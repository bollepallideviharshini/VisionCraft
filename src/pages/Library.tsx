import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Trash2, Globe, Download, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  aspect_ratio: string;
  style: string | null;
  is_public: boolean;
  created_at: string;
}

export default function Library() {
  const { user } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) setImages(data as GeneratedImage[]);
    setLoading(false);
  };

  const togglePublic = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("generated_images")
      .update({ is_public: !current })
      .eq("id", id);
    if (!error) {
      setImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, is_public: !current } : img))
      );
    }
  };

  const deleteImage = async (id: string) => {
    const { error } = await supabase.from("generated_images").delete().eq("id", id);
    if (!error) {
      setImages((prev) => prev.filter((img) => img.id !== id));
      toast({ title: "Image deleted" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">
          My <span className="gradient-text">Library</span>
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImageOff className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg">No images yet</p>
            <p className="text-sm">Generate your first image from the homepage!</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
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
                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                      <p className="text-xs text-white/80 line-clamp-2">{img.prompt}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => togglePublic(img.id, img.is_public)}
                        >
                          <Globe className={`h-3.5 w-3.5 ${img.is_public ? "text-primary" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = img.image_url;
                            a.download = "visioncraft.png";
                            a.click();
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-white/70 hover:text-destructive hover:bg-white/10"
                          onClick={() => deleteImage(img.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
