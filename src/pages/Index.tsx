import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGuestCredits } from "@/hooks/use-guest-credits";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import ChatThread, { type ChatMessage } from "@/components/ChatThread";
import ChatPromptBar from "@/components/ChatPromptBar";
import InspirationFeed from "@/components/InspirationFeed";
import GuestLimitModal from "@/components/GuestLimitModal";
import GenerationSidebar from "@/components/GenerationSidebar";
import RefineModal from "@/components/RefineModal";
import { Terminal, Menu } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inspirationPrompt, setInspirationPrompt] = useState("");
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Refine modal state
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineImageUrl, setRefineImageUrl] = useState("");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refineMessageId, setRefineMessageId] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedImageUrl, setRefinedImageUrl] = useState<string | undefined>();

  const { remaining, maxCredits, hasCredits, consumeCredit, saveGuestImage, getGuestImages, clearGuestData } = useGuestCredits();

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
      toast({ title: "Guest images transferred", description: `${guestImages.length} image(s) added to your library.` });
    };
    transferImages();
  }, [user]);

  const buildChatHistory = useCallback(() => {
    return messages
      .filter((m) => !m.isGenerating)
      .map((m) => ({
        role: m.role,
        prompt: m.prompt,
        imageUrl: m.imageUrl,
      }));
  }, [messages]);

  const generateImage = useCallback(async (
    prompt: string,
    aspectRatio: string,
    style: string,
    options: { variationMode?: boolean; skipUserBubble?: boolean } = {}
  ) => {
    if (!user && !hasCredits) {
      setShowLimitModal(true);
      return;
    }

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();

    if (!options.skipUserBubble) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", prompt, aspectRatio, style: style || undefined, timestamp: new Date() },
        { id: aiMsgId, role: "assistant", prompt, isGenerating: true, timestamp: new Date() },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", prompt, isGenerating: true, timestamp: new Date() },
      ]);
    }

    setIsGenerating(true);

    try {
      const fullPrompt = style ? `${prompt}, in ${style} style` : prompt;
      const chatHistory = buildChatHistory();

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: fullPrompt,
          aspectRatio,
          isGuest: !user,
          chatHistory,
          variationMode: options.variationMode || false,
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, imageUrl: data.imageUrl, isGenerating: false } : m
        )
      );

      if (!user) {
        consumeCredit();
        saveGuestImage(data.imageUrl, prompt, aspectRatio, style || null);
      }

      toast({ title: "Done", description: "Image generated." });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [user, hasCredits, consumeCredit, saveGuestImage, buildChatHistory]);

  const handleGenerate = useCallback((prompt: string, aspectRatio: string, style: string) => {
    generateImage(prompt, aspectRatio, style);
  }, [generateImage]);

  const handleRegenerate = useCallback((_messageId: string, prompt: string, aspectRatio?: string, style?: string) => {
    generateImage(prompt, aspectRatio || "1:1", style || "", { skipUserBubble: true });
  }, [generateImage]);

  const handleVariations = useCallback(async (_messageId: string, prompt: string, aspectRatio?: string, style?: string) => {
    for (let i = 0; i < 4; i++) {
      await generateImage(prompt, aspectRatio || "1:1", style || "", { variationMode: true, skipUserBubble: i > 0 });
    }
  }, [generateImage]);

  const handleOpenRefine = useCallback((messageId: string, imageUrl: string, prompt: string) => {
    setRefineMessageId(messageId);
    setRefineImageUrl(imageUrl);
    setRefinePrompt(prompt);
    setRefinedImageUrl(undefined);
    setRefineOpen(true);
  }, []);

  const handleRefineEdit = useCallback(async (editPrompt: string) => {
    if (!user && !hasCredits) {
      setShowLimitModal(true);
      return;
    }

    setIsRefining(true);

    try {
      const chatHistory = buildChatHistory();
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: editPrompt,
          aspectRatio: "1:1",
          isGuest: !user,
          chatHistory,
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      setRefinedImageUrl(data.imageUrl);

      // Also add to chat thread
      const aiMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", prompt: editPrompt, timestamp: new Date() },
        { id: aiMsgId, role: "assistant", prompt: editPrompt, imageUrl: data.imageUrl, timestamp: new Date() },
      ]);

      if (!user) {
        consumeCredit();
        saveGuestImage(data.imageUrl, editPrompt, "1:1", null);
      }

      toast({ title: "Refined", description: "Edit applied." });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  }, [user, hasCredits, buildChatHistory, consumeCredit, saveGuestImage]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full bg-background">
        <GenerationSidebar messages={messages} />

        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <GuestLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />

          <div className="flex items-center border-b border-border/30 px-4 h-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[800px] px-4 py-8">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center min-h-[60vh]"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-card/50 mb-5">
                    <Terminal className="h-4 w-4 text-muted-foreground/70" />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                    VisionCraft
                  </h1>
                  <p className="text-sm text-muted-foreground/70">
                    What would you like to create today?
                  </p>
                </motion.div>
              ) : (
                <ChatThread
                  messages={messages}
                  onRegenerate={handleRegenerate}
                  onVariations={handleVariations}
                  onRefine={handleOpenRefine}
                />
              )}
            </div>
          </div>

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

        <RefineModal
          open={refineOpen}
          onClose={() => setRefineOpen(false)}
          imageUrl={refineImageUrl}
          prompt={refinePrompt}
          onRefine={handleRefineEdit}
          isRefining={isRefining}
          refinedImageUrl={refinedImageUrl}
        />
      </div>
    </SidebarProvider>
  );
}
