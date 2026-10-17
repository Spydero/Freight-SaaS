"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Card, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  async function load() {
    const data = await api<{ notifications: Notification[] }>("/v1/notifications");
    setItems(data.notifications);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function markRead(id: string) {
    await api(`/v1/notifications/${id}/read`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app stand-in for email — quote ready, milestones, and demo alerts."
      />
      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className={`p-4 ${n.readAt ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{n.title}</div>
                <p className="mt-1 text-sm text-white/65">{n.body}</p>
                <p className="mt-2 text-xs text-white/40">{formatDate(n.createdAt)}</p>
              </div>
              {!n.readAt ? (
                <Button variant="ghost" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
        {!items.length ? <p className="text-sm text-white/45">No notifications.</p> : null}
      </div>
    </div>
  );
}
