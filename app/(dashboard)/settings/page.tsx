'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace settings
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <SettingsIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Settings page coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

