import { useEffect } from "react";
import { useToast } from "@mairie360/lib-components/primitives";

import type { CatalogFeedback } from "../../module-model";

export interface CatalogToastsProps {
  feedback: CatalogFeedback[];
  /** Called once a feedback became a toast, so it is never shown twice. */
  onShown: (id: number) => void;
}

/** MAIR-920: every action outcome becomes a toast of the lib ToastProvider (rendered inside it). */
export const CatalogToasts = ({ feedback, onShown }: CatalogToastsProps) => {
  const toast = useToast();
  useEffect(() => {
    for (const item of feedback) {
      toast.notify({ tone: item.tone, title: item.title, message: item.message ?? item.title, duration: item.tone === "danger" ? null : 5000 });
      onShown(item.id);
    }
  }, [feedback, onShown, toast]);
  return null;
};
