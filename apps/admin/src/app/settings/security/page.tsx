"use client";

import Link from "next/link";
import { Button, Card } from "@t360/ui";

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Security</h1>
        <p className="text-sm text-muted">Password, MFA, and session controls</p>
      </div>
      <Card className="space-y-3">
        <p className="text-sm text-muted">
          Manage your password and active sessions from your profile. MFA setup uses{" "}
          <code>/auth/mfa/setup</code> for accounts with settings.manage.
        </p>
        <Link href="/profile">
          <Button type="button">Open profile</Button>
        </Link>
      </Card>
    </div>
  );
}
