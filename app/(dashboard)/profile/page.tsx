'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Profile = {
  name: string;
  email: string;
  company: string;
  phone: string;
  title: string;
  avatarUrl?: string;
};

const initialProfile: Profile = {
  name: '',
  email: '',
  company: '',
  phone: '',
  title: '',
  avatarUrl: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialProfile.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof Profile) => (e: ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSaved(false);
    // In a real app, upload to storage here and save the returned URL.
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      const metadata = user?.user_metadata || {};
      setProfile({
        name: metadata.name || metadata.full_name || '',
        email: user?.email || '',
        company: metadata.company || '',
        phone: metadata.phone || '',
        title: metadata.title || '',
        avatarUrl: metadata.avatarUrl || metadata.avatar_url || '',
      });
      setPreviewUrl(metadata.avatarUrl || metadata.avatar_url || '');
    } catch (err: any) {
      setError(err.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // We intentionally call once on mount; for live updates consider auth onAuthStateChange.
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: profile.email,
        data: {
          name: profile.name,
          full_name: profile.name,
          company: profile.company,
          phone: profile.phone,
          title: profile.title,
          avatarUrl: previewUrl,
        },
      });
      if (updateError) throw updateError;
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your basic account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your info…</p>
          ) : (
            <>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xl font-semibold overflow-hidden">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-foreground">Profile picture</Label>
              <Input type="file" accept="image/*" onChange={handleAvatarChange} className="max-w-xs" />
              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={profile.name} onChange={handleChange('name')} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={handleChange('email')} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={profile.company} onChange={handleChange('company')} placeholder="Company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={profile.title} onChange={handleChange('title')} placeholder="Role / title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={profile.phone} onChange={handleChange('phone')} placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            {saved && <span className="text-sm text-emerald-600">Saved</span>}
          </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

