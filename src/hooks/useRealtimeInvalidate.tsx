import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "reconnecting";

type Watch = {
  table: string;
  filter?: string;
  /** Query keys to invalidate when a change comes in. */
  keys: unknown[][];
};

/**
 * Subscribes to postgres changes for the given tables and invalidates the
 * matching queries so the UI stays live without a refresh.
 */
export function useRealtimeInvalidate(
  channelName: string,
  watches: Watch[],
  enabled = true,
): RealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const signature = JSON.stringify(
    watches.map((w) => [w.table, w.filter ?? "", w.keys]),
  );

  useEffect(() => {
    if (!enabled) return;
    const parsed: Watch[] = JSON.parse(signature).map(
      ([table, filter, keys]: [string, string, unknown[][]]) => ({
        table,
        filter: filter || undefined,
        keys,
      }),
    );

    let channel = supabase.channel(channelName);
    for (const watch of parsed) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: watch.table,
          ...(watch.filter ? { filter: watch.filter } : {}),
        },
        () => {
          for (const key of watch.keys) {
            void queryClient.invalidateQueries({ queryKey: key });
          }
        },
      );
    }

    channel.subscribe((state) => {
      if (state === "SUBSCRIBED") setStatus("live");
      else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED")
        setStatus("reconnecting");
      else setStatus("connecting");
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, signature, enabled, queryClient]);

  return enabled ? status : "connecting";
}
