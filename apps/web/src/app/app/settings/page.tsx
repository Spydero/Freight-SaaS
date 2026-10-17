"use client";

import { useAuth } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="Profile and organization (demo)." />
      <Card className="max-w-lg p-6">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-white/45">Name</dt>
            <dd className="mt-1 text-lg">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-white/45">Email</dt>
            <dd className="mt-1">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-white/45">Role</dt>
            <dd className="mt-1">{user?.role}</dd>
          </div>
          <div>
            <dt className="text-white/45">Organization</dt>
            <dd className="mt-1">{user?.organizationName}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-white/40">
          Password changes and org rename can be extended later. Seeded demo password: demo1234.
        </p>
      </Card>
    </div>
  );
}
