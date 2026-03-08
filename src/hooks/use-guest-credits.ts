import { useState, useEffect, useCallback } from "react";

const GUEST_CREDITS_KEY = "visioncraft_guest_credits";
const GUEST_IMAGES_KEY = "visioncraft_guest_images";
const MAX_GUEST_CREDITS = 5;

export function useGuestCredits() {
  const [remaining, setRemaining] = useState(() => {
    const stored = localStorage.getItem(GUEST_CREDITS_KEY);
    return stored !== null ? parseInt(stored, 10) : MAX_GUEST_CREDITS;
  });

  useEffect(() => {
    localStorage.setItem(GUEST_CREDITS_KEY, String(remaining));
  }, [remaining]);

  const consumeCredit = useCallback(() => {
    setRemaining((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem(GUEST_CREDITS_KEY, String(next));
      return next;
    });
  }, []);

  const saveGuestImage = useCallback((imageUrl: string, prompt: string, aspectRatio: string, style: string | null) => {
    const images = JSON.parse(localStorage.getItem(GUEST_IMAGES_KEY) || "[]");
    images.push({ imageUrl, prompt, aspectRatio, style, createdAt: new Date().toISOString() });
    localStorage.setItem(GUEST_IMAGES_KEY, JSON.stringify(images));
  }, []);

  const getGuestImages = useCallback(() => {
    return JSON.parse(localStorage.getItem(GUEST_IMAGES_KEY) || "[]") as Array<{
      imageUrl: string;
      prompt: string;
      aspectRatio: string;
      style: string | null;
      createdAt: string;
    }>;
  }, []);

  const clearGuestData = useCallback(() => {
    localStorage.removeItem(GUEST_CREDITS_KEY);
    localStorage.removeItem(GUEST_IMAGES_KEY);
    setRemaining(MAX_GUEST_CREDITS);
  }, []);

  return {
    remaining,
    maxCredits: MAX_GUEST_CREDITS,
    hasCredits: remaining > 0,
    consumeCredit,
    saveGuestImage,
    getGuestImages,
    clearGuestData,
  };
}
