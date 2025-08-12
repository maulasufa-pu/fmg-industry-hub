// src/app/client/settings/settings-client.tsx  (CLIENT COMPONENT)
"use client";
import { useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ensureFreshSession } from "@/lib/supabase/safe";

type FormData = {
  firstName: string;
  lastName: string;
  artistName: string;
  location: string;
  phoneNumber: string;
};

export default function SettingsClient({ initialData }: { initialData: FormData }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSave = async () => {
    setSaving(true); setErr(null); setShowSuccessMessage(false);
    await ensureFreshSession();
    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr) { setErr(uErr.message); setSaving(false); return; }
    if (!user) { setErr("Session not found."); setSaving(false); return; }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        artist_name: formData.artistName || null,
        location: formData.location || null,
        phone_number: formData.phoneNumber || null,
      },
      { onConflict: "id" }
    );

    if (error) setErr(error.message);
    else setShowSuccessMessage(true);
    setSaving(false);
  };

  // … render form yang sama, pakai formData, handleSave …
  return <div>{/* UI mu */}</div>;
}
