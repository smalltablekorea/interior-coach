"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

export interface ChannelConnection {
  accountName: string | null;
  accountId?: string | null;
  hasToken: boolean;
  tokenExpiresAt: string | null;
  isActive: boolean;
}

export function useChannelConnection(channel: string) {
  const [connection, setConnection] = useState<ChannelConnection | null>(null);

  useEffect(() => {
    apiFetch(`/api/marketing/channels?channel=${channel}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setConnection(data); })
      .catch(() => {});
  }, [channel]);

  return { connection, setConnection };
}
