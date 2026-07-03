"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";

type Props = {
  labels: { subscribe: string; subscribed: string; error: string };
};

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushSubscribeButton({ labels }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await fetch("/api/push/vapid");
      const { publicKey } = await vapidRes.json();
      if (!publicKey) throw new Error("no vapid");

      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("denied");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          topics: ["lives", "campaigns", "help"],
        }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={subscribe}
        loading={status === "loading"}
        disabled={status === "done"}
        className="border-cfm-gold/40 hover:bg-cfm-gold/10"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {status === "done" ? labels.subscribed : labels.subscribe}
      </Button>
      {status === "error" && (
        <Alert variant="error" className="mt-2 text-xs">
          {labels.error}
        </Alert>
      )}
    </div>
  );
}
