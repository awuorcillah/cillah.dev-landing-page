use client;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, CheckCircle, UserCheck } from 'lucide-react';

export default function UserProfile() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load user profile
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUserEmail(user.email || '');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (e: any) {
        toast.error(e.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const filePath = `${user.id}/${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = publicData.publicUrl;

      // Update profile record
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      if (updateErr) throw updateErr;

      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success('Profile picture updated');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-100">
        <span className="animate-pulse">Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700 p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-[#C9A66B]" />
          Your Profile
        </h1>
        <div className="flex items-center gap-6 mb-6">
          <img
            src={profile?.avatar_url || '/placeholder-avatar.png'}
            alt="Avatar"
            className="h-24 w-24 rounded-full border border-[#C9A66B]/30 object-cover"
          />
          <div>
            <p className="text-lg font-medium">{profile?.full_name || 'Unnamed User'}</p>
            <p className="text-sm text-slate-400">{userEmail}</p>
            <p className="text-sm text-slate-300 mt-1">Role: {profile?.role ?? 'user'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300">Change Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#C9A66B] file:text-[#1C1C1C] hover:file:bg-[#C9A66B]/80"
          />
          {uploading && <p className="text-sm text-slate-400">Uploading…</p>}
        </div>
        <div className="mt-8 flex gap-4">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A66B] text-[#1C1C1C] rounded-md hover:bg-[#C9A66B]/90">
            <CheckCircle className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
