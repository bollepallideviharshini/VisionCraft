import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASPECT_RATIO_MAP: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

interface ChatHistoryItem {
  role: "user" | "assistant";
  prompt: string;
  imageUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);

    let user = null;
    if (authHeader) {
      const { data: { user: authUser }, error: authError } = await anonClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      if (!authError && authUser) {
        user = authUser;
      }
    }

    const { prompt, aspectRatio = "1:1", chatHistory = [], variationMode = false } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
      throw new Error("Invalid prompt");
    }

    const dims = ASPECT_RATIO_MAP[aspectRatio] || ASPECT_RATIO_MAP["1:1"];

    // Build conversational messages for the AI
    const aiMessages: any[] = [];

    // System message for context
    aiMessages.push({
      role: "user",
      content: "You are an image generation AI. Generate images based on user descriptions. When the user refers to previous images or asks for modifications, use the conversation context to understand what they want changed.",
    });

    // Add chat history for conversational memory (last 6 exchanges max)
    const recentHistory = (chatHistory as ChatHistoryItem[]).slice(-6);
    for (const item of recentHistory) {
      if (item.role === "user") {
        aiMessages.push({
          role: "user",
          content: `Previous request: ${item.prompt}`,
        });
      } else if (item.role === "assistant" && item.imageUrl) {
        // Include the previous image as reference
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: "Here is the image that was generated from the previous request:" },
            { type: "image_url", image_url: { url: item.imageUrl } },
          ],
        });
      }
    }

    // Current request
    const variationSuffix = variationMode
      ? " Create a slight variation of this concept with minor creative differences."
      : "";
    
    const hasHistory = recentHistory.length > 0;
    const contextPrefix = hasHistory
      ? "Based on our conversation above, generate a new image: "
      : "Generate a high-quality image: ";

    aiMessages.push({
      role: "user",
      content: `${contextPrefix}${prompt}${variationSuffix}`,
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: aiMessages,
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image generated from AI");
    }

    const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const ext = base64Match[1];
    const base64 = base64Match[2];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const folder = user ? user.id : "guest";
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabaseClient.storage
      .from("user_images")
      .upload(fileName, bytes, { contentType: `image/${ext}`, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to save image");
    }

    const { data: urlData } = supabaseClient.storage
      .from("user_images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    let imageId = null;

    if (user) {
      const { data: insertData, error: insertError } = await supabaseClient
        .from("generated_images")
        .insert({
          user_id: user.id,
          prompt,
          image_url: imageUrl,
          aspect_ratio: aspectRatio,
          is_public: false,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
      }
      imageId = insertData?.id;
    }

    return new Response(
      JSON.stringify({ imageUrl, imageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-image error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
