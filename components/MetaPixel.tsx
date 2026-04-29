"use client";

import { useEffect } from "react";

interface MetaPixelViewContentProps {
  contentName: string;
  contentIds: string[];
  value?: number;
  currency?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackViewContent({
  contentName,
  contentIds,
  value,
  currency = "NGN",
}: MetaPixelViewContentProps) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: contentName,
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: currency,
    });
  }
}

export function trackPurchase({
  value,
  currency = "NGN",
  contentIds,
  contentName,
}: {
  value: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      value: value,
      currency: currency,
      content_ids: contentIds,
      content_name: contentName,
      content_type: "product",
    });
  }
}

export default function MetaPixelViewContent({
  contentName,
  contentIds,
  value,
  currency = "NGN",
}: MetaPixelViewContentProps) {
  useEffect(() => {
    trackViewContent({ contentName, contentIds, value, currency });
  }, [contentName, contentIds, value, currency]);

  return null;
}
