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
import { Menu, Brush, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const { remaining, maxCredits, hasCredits, consumeCredit, consumeCredits, saveGuestImage, getGuestImages, clearGuestData } = useGuestCredits();

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
          is_public: false
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
        textResponse: m.textResponse,
      }));
  }, [messages]);

  // Single image generation (used internally)
  const generateSingle = useCallback(async (
    prompt: string,
    aspectRatio: string,
    chatHistory: any[],
    options: { variationMode?: boolean; forceImage?: boolean } = {}
  ): Promise<{ type: string; imageUrl?: string; textResponse?: string; contextShift?: string } | null> => {
    const { data, error } = await supabase.functions.invoke("generate-image", {
      body: {
        prompt,
        aspectRatio,
        isGuest: !user,
        chatHistory,
        variationMode: options.variationMode || false,
        forceImage: options.forceImage || false,
      },
    });
    if (error) throw error;
    return data;
  }, [user]);

  // Main prompt handler supporting quantity
  const handlePrompt = useCallback(async (
    prompt: string,
    aspectRatio: string,
    style: string,
    options: { quantity?: number; variationMode?: boolean; skipUserBubble?: boolean; forceImage?: boolean } = {}
  ) => {
    const quantity = options.quantity || 1;

    // Credit check for guests
    if (!user) {
      if (remaining < quantity) {
        if (remaining === 0) {
          setShowLimitModal(true);
          return;
        }
        toast({
          title: "Not enough credits",
          description: `You need ${quantity} credits but only have ${remaining}. Reduce the quantity or sign up for more.`,
          variant: "destructive",
        });
        return;
      }
    }

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();
    const isMulti = quantity > 1;

    if (!options.skipUserBubble) {
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", prompt, aspectRatio, style: style || undefined, timestamp: new Date() },
        { id: aiMsgId, role: "assistant", prompt, isGenerating: true, generatingLabel: isMulti ? `Painting ${quantity} visions...` : "Thinking...", timestamp: new Date() },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", prompt, isGenerating: true, generatingLabel: isMulti ? `Painting ${quantity} visions...` : "Painting your vision...", timestamp: new Date() },
      ]);
    }

    setIsGenerating(true);

    try {
      const fullPrompt = style ? `${prompt}, in ${style} style` : prompt;
      const chatHistory = buildChatHistory();

      if (quantity === 1) {
        // Single image or chat
        const data = await generateSingle(fullPrompt, aspectRatio, chatHistory, {
          variationMode: options.variationMode,
          forceImage: options.forceImage,
        });

        if (!data) throw new Error("No response");

        if (data.type === "chat") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, textResponse: data.textResponse, isGenerating: false, generatingLabel: undefined }
                : m
            )
          );
          return;
        }

        // If the AI acknowledged a topic switch, show it briefly before the image
        if (data.contextShift) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, textResponse: data.contextShift, isGenerating: true, generatingLabel: "Painting your vision..." }
                : m
            )
          );
        }

        if (!data.imageUrl) throw new Error("No image returned");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, imageUrl: data.imageUrl, isGenerating: false, generatingLabel: undefined }
              : m
          )
        );

        if (!user) {
          consumeCredit();
          saveGuestImage(data.imageUrl!, prompt, aspectRatio, style || null);
        }

        toast({ title: "Done", description: "Image generated." });
      } else {
        // Multi-image: progressive loading with style injection
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, imageUrls: [], imageSlots: quantity, failedSlots: [], isGenerating: true, generatingLabel: `Painting ${quantity} visions...` }
              : m
          )
        );

        // Style variations: if user mentions styles or we're doing multi, inject unique styles
        const styleVariations = [
          ", traditional hand-painted style",
          ", modern digital vector style",
          ", rich oil painting style",
          ", delicate watercolor style",
        ];

        // Composition variations as fallback seeds
        const seedVariations = [
          ", unique composition with warm tones",
          ", alternative angle with cool palette",
          ", dramatic lighting with bold contrast",
          ", soft ethereal mood with muted colors",
        ];

        const appendImageAtSlot = (url: string, slotIdx: number) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMsgId) return m;
              const updated = [...(m.imageUrls || []), url];
              const failedCount = (m.failedSlots || []).length;
              const done = updated.length + failedCount >= quantity;
              return {
                ...m,
                imageUrls: updated,
                isGenerating: !done,
                generatingLabel: done ? undefined : `${updated.length}/${quantity} ready...`,
              };
            })
          );
        };

        const markSlotFailed = (slotIdx: number) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMsgId) return m;
              const failed = [...(m.failedSlots || []), slotIdx];
              const successCount = (m.imageUrls || []).length;
              const done = successCount + failed.length >= quantity;
              return {
                ...m,
                failedSlots: failed,
                isGenerating: !done,
                generatingLabel: done ? undefined : m.generatingLabel,
              };
            })
          );
        };

        // Detect if user wants different styles
        const wantsStyles = /style|variation|version|different/i.test(prompt);

        const promises = Array.from({ length: quantity }, (_, idx) => {
          const suffix = wantsStyles
            ? styleVariations[idx % styleVariations.length]
            : seedVariations[idx % seedVariations.length];

          return generateSingle(`${fullPrompt}${suffix}`, aspectRatio, chatHistory, { variationMode: true, forceImage: true })
            .then((data) => {
              if (data?.imageUrl) {
                appendImageAtSlot(data.imageUrl, idx);
                if (!user) {
                  consumeCredit();
                  saveGuestImage(data.imageUrl, prompt, aspectRatio, style || null);
                }
              } else {
                console.warn(`Slot ${idx}: No image returned`, data);
                markSlotFailed(idx);
              }
              return data;
            })
            .catch((err) => {
              console.error(`Slot ${idx} failed:`, err);
              markSlotFailed(idx);
              return null;
            });
        });

        await Promise.all(promises);

        // Final cleanup
        setMessages((prev) => {
          const msg = prev.find((m) => m.id === aiMsgId);
          if (msg && (!msg.imageUrls || msg.imageUrls.length === 0) && (!msg.failedSlots || msg.failedSlots.length === 0)) {
            return prev.filter((m) => m.id !== aiMsgId);
          }
          return prev.map((m) =>
            m.id === aiMsgId ? { ...m, isGenerating: false, generatingLabel: undefined } : m
          );
        });

        toast({ title: "Done", description: "Images generated." });
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [user, remaining, consumeCredit, consumeCredits, saveGuestImage, buildChatHistory, generateSingle]);

  const handleGenerate = useCallback((prompt: string, aspectRatio: string, style: string, quantity: number) => {
    handlePrompt(prompt, aspectRatio, style, { quantity });
  }, [handlePrompt]);

  const handleRegenerate = useCallback((_messageId: string, prompt: string, aspectRatio?: string, style?: string) => {
    handlePrompt(prompt, aspectRatio || "1:1", style || "", { skipUserBubble: true, forceImage: true });
  }, [handlePrompt]);

  const handleVariations = useCallback((_messageId: string, prompt: string, aspectRatio?: string, style?: string) => {
    handlePrompt(prompt, aspectRatio || "1:1", style || "", { quantity: 4, skipUserBubble: true, forceImage: true });
  }, [handlePrompt]);

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
          forceImage: true,
        }
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error("No image returned");

      setRefinedImageUrl(data.imageUrl);

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

          <div className="flex items-center border-b border-border/30 px-4 h-10 justify-between">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-[11px] font-mono text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => {
                  setMessages([]);
                  toast({ title: "Chat cleared", description: "Starting fresh!" });
                }}
              >
                <Trash2 className="h-3 w-3" /> New Chat
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[800px] px-4 py-8">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-8">
                  <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-3"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-border bg-card mb-4">
                      <Brush className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                      VisionCraft
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Describe an image and watch it come to life. Start typing or pick an inspiration below.
                    </p>
                  </motion.div>

                  <InspirationFeed onSelect={(p) => setInspirationPrompt(p)} />
                </div>
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
