import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGuestCredits } from "@/hooks/use-guest-credits";
import Navbar from "@/components/Navbar";
import ChatThread, { type ChatMessage } from "@/components/ChatThread";
import ChatPromptBar from "@/components/ChatPromptBar";
import InspirationFeed from "@/components/InspirationFeed";
import GuestLimitModal from "@/components/GuestLimitModal";
import { Sparkles } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inspirationPrompt, setInspirationPrompt] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { remaining, maxCredits, hasCredits, consumeCredit, saveGuestImage, getGuestImages, clearGuestData } = useGuestCredits();

  // Transfer guest images on sign-in
  useEffect(() => {
    if (!user) return;
    const guestImages = getGuestImages();
    if (guestImages.length === 0) return;

    const transferImages = async () => {
      for (const img of guestImages) {
        await supabase.from("generated_images").insert({
          user_id: user.id,
          prompt: img.prompt,
          image_url: img.imageUrl,
          aspect_ratio: img.aspectRatio,
          style: img.style,
          is_public: false,
        });
      }
      clearGuestData();
      toast({ title: "Guest images transferred!", description: `${guestImages.length} image(s) added to your library.` });
    };
    transferImages();
  }, [user]);

  const handleGenerate = useCallback(async (prompt: string, aspectRatio: string, style: string) => {
    if (!user && !hasCredits) {
      setShowLimitModal(true);
      return;
    }

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();

    // Add user bubble + generating bubble
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", prompt, aspectRatio, style: style || undefined, timestamp: new Date() },
      { id: aiMsgId, role: "assistant", prompt, isGenerating: true, timestamp: new Date() },
    ]);

    setIsGenerating(true);

    try {
      const fullPrompt = style ? `${prompt}, in ${style} style` : prompt;

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: fullPrompt, aspectRatio, isGuest: !user },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      // Update the AI bubble with the result
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, imageUrl: data.imageUrl, isGenerating: false } : m
        )
      );

      if (!user) {
        consumeCredit();
        saveGuestImage(data.imageUrl, prompt, aspectRatio, style || null);
      }

      toast({ title: "Image generated!", description: "Your creation is ready." });
    } catch (err: any) {
      // Remove the failed AI bubble
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [user, hasCredits, consumeCredit, saveGuestImage]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <GuestLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      {/* Scrollable chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg glow mb-4">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Generate Your <span className="gradient-text">Vision</span>
                </h1>
                <p className="text-base text-muted-foreground max-w-md mx-auto">
                  Describe an image and watch it come to life. Start typing below or pick an inspiration.
                </p>
              </motion.div>

              <InspirationFeed onSelect={(p) => setInspirationPrompt(p)} />
            </div>
          ) : (
            <ChatThread messages={messages} />
          )}
        </div>
      </div>

      {/* Sticky prompt bar */}
      <div className="relative z-20">
        <ChatPromptBar
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          initialPrompt={inspirationPrompt}
          guestCreditsRemaining={!user ? remaining : undefined}
          guestCreditsMax={!user ? maxCredits : undefined}
        />
      </div>
    </div>
  );
}
