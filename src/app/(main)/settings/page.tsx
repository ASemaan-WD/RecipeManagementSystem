import type { Metadata } from 'next';

import { ProfileForm } from '@/components/settings/profile-form';

export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and profile.
        </p>
      </div>

      <div className="max-w-2xl">
        <ProfileForm />
      </div>
    </div>
  );
}
