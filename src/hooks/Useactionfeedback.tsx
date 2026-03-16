// src/hooks/useActionFeedback.tsx
import { useState, useCallback } from "react";
import type { FeedbackType } from "@/components/FeedbackOverlay";

export type { FeedbackType };

export interface FeedbackState {
  type: FeedbackType | null;
  targetId: string | null;
}

export function useActionFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, targetId: null });

  const trigger = useCallback((type: FeedbackType, targetId?: string) => {
    setFeedback({ type, targetId: targetId ?? null });
  }, []);

  const clear = useCallback(() => {
    setFeedback({ type: null, targetId: null });
  }, []);

  return { feedback, trigger, clear };
}