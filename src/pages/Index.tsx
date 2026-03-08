import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import PromptBar from "@/components/PromptBar";
import InspirationFeed from "@/components/InspirationFeed";
import ImagePreview from "@/components/ImagePreview";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [inspirationPrompt, setInspirationPrompt] = useState("");

  const handleInspirationSelect = (prompt: string) => {
    setInspirationPrompt(prompt);
  };

  const handleGenerate = useCallback(async (prompt: string, aspectRatio: string, style: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setLastPrompt(prompt);

    try {
      const fullPrompt = style ? `${prompt}, in ${style} style` : prompt;

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: fullPrompt, aspectRatio },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      setGeneratedImage(data.imageUrl);
      setCurrentImageId(data.imageId);
      setIsPublic(false);
      toast({ title: "Image generated!", description: "Your creation is ready." });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [user, navigate]);

  const handleTogglePublic = async () => {
    if (!currentImageId) return;
    const newValue = !isPublic;
    const { error } = await supabase
      .from("generated_images")
      .update({ is_public: newValue })
      .eq("id", currentImageId);
    if (!error) {
      setIsPublic(newValue);
      toast({ title: newValue ? "Image is now public" : "Image is now private" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 space-y-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Generate Your <span className="gradient-text">Vision</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Transform ideas into stunning visuals with AI-powered image generation.
            Type a description and watch it come to life.
          </p>
        </motion.div>

        {/* Prompt Bar */}
        <PromptBar
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          initialPrompt={inspirationPrompt}
        />

        {/* Generated Image Preview */}
        <ImagePreview
          imageUrl={generatedImage}
          isGenerating={isGenerating}
          prompt={lastPrompt}
          onTogglePublic={handleTogglePublic}
          isPublic={isPublic}
        />

        {/* Inspiration Feed */}
        {!generatedImage && !isGenerating && (
          <InspirationFeed onSelect={(p) => setInspirationPrompt(p)} />
        )}
      </main>
    </div>
  );
}
