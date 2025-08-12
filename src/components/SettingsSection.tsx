// src/components/SettingsSection.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { User, Check, Close } from "@/icons";
import { getSupabaseClient } from "@/lib/supabase/client";

import AccountPanel from "@/components/settings/AccountPanel";
import BillingPanel from "@/components/settings/BillingPanel";
import SubscriptionsPanel from "@/components/settings/SubscriptionsPanel";
import { ensureFreshSession } from "@/lib/supabase/safe";

type FormData = {
  firstName: string;
  lastName: string;
  artistName: string;
  location: string;
  phoneNumber: string;
};

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MIN_W = 400;
const MIN_H = 400;
// Set true kalau bucket public (paling gampang). Kalau private, set false.
const USE_PUBLIC_BUCKET = true;

export const SettingsSection = () => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMenuItem, setActiveMenuItem] = useState("Edit Profile");
  const [formData, setFormData] = useState<FormData>({
    firstName: "", lastName: "", artistName: "", location: "", phoneNumber: "",
  });


  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // helper: buat URL dari path
  const refreshAvatarUrl = async (path: string | null) => {
    if (!path) { setAvatarUrl(null); return; }
    if (USE_PUBLIC_BUCKET) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } else {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
      if (!error) setAvatarUrl(data.signedUrl);
    }
  };

  // ambil dimensi image
  const getImageSize = (file: File): Promise<{w:number;h:number}> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Load profile
  useEffect(() => {
    let aborted = false;
    (async () => {
      setLoading(true);
      setErr(null);

      await ensureFreshSession();
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (aborted) return;
      if (uErr) { setErr(uErr.message); setLoading(false); return; }
      if (!user) { setErr("Not authenticated."); setLoading(false); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, artist_name, location, phone_number, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      if (aborted) return;
      if (error) setErr(error.message);
      else if (data) {
        setFormData({
          firstName: data.first_name ?? "",
          lastName: data.last_name ?? "",
          artistName: data.artist_name ?? "",
          location: data.location ?? "",
          phoneNumber: data.phone_number ?? "",
        });
        setAvatarPath(data.avatar_path ?? null);
        await refreshAvatarUrl(data.avatar_path ?? null);
      }
      setLoading(false);
    })();

    return () => { aborted = true; };
  }, [supabase]);

  const handleInputChange = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setShowSuccessMessage(false);
    setErr(null);

    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr) { setErr(uErr.message); setSaving(false); return; }
    if (!user) { setErr("Session not found."); setSaving(false); return; }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: formData.firstName || null,
      last_name: formData.lastName || null,
      artist_name: formData.artistName || null,
      location: formData.location || null,
      phone_number: formData.phoneNumber || null,
      avatar_path: avatarPath || null,
    }, { onConflict: "id" });

    if (error) setErr(error.message);
    else setShowSuccessMessage(true);

    setSaving(false);
  };

  // Upload
  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] || null;
  if (!file) return;

    setErr(null);
    // 1) Validasi ukuran
    if (file.size > MAX_BYTES) {
      setErr("Max file size is 2MB.");
      e.target.value = "";
      return;
    }
    // 2) Validasi tipe
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setErr("Only PNG, JPG/JPEG, or WEBP are allowed.");
      e.target.value = "";
      return;
    }
    // 3) Validasi dimensi
    try {
      const { w, h } = await getImageSize(file);
      if (w < MIN_W || h < MIN_H) {
        setErr(`Minimum ${MIN_W}×${MIN_H}px. Your image is ${w}×${h}px.`);
        e.target.value = "";
        return;
      }
    } catch {
      setErr("Failed to read image.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!user) throw new Error("Not authenticated.");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      if (avatarPath && avatarPath !== path) {
        await supabase.storage.from(BUCKET).remove([avatarPath]).catch(() => {});
      }

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarPath(path);
      await refreshAvatarUrl(path);
      setShowSuccessMessage(true);
    } catch (e: unknown) {                    // ⬅️ was: any
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };


  // Remove
  const onRemoveAvatar = async () => {
    setUploading(true);
    setErr(null);
    try {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!user) throw new Error("Not authenticated.");

      if (avatarPath) {
        await supabase.storage.from(BUCKET).remove([avatarPath]).catch(() => {});
      }
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_path: null })
        .eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarPath(null);
      setAvatarUrl(null);
      setShowSuccessMessage(true);
    } catch (e: unknown) {                    // ⬅️ was: any
      setErr(e instanceof Error ? e.message : "Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  };


  const handleCloseSuccess = () => setShowSuccessMessage(false);

  return (
    <div className="flex flex-col items-start gap-6 p-6 relative flex-1 grow">
      <div className="flex items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-12 relative flex-1 grow">
          <div className="flex-col items-center gap-2 flex relative self-stretch w-full flex-[0_0_auto]">
            <h1 className="relative self-stretch mt-[-1.00px] font-heading-2 text-coolgray-90">
              Settings
            </h1>
            {(loading || uploading) && <p className="text-xs text-coolgray-60">
              {loading ? "Loading profile…" : "Uploading…"}
            </p>}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-6 relative self-stretch w-full">
        {/* left nav */}
        <nav
          className="flex-col w-[220px] items-start p-2 bg-defaultwhite border border-coolgray-20 flex"
          role="navigation"
          aria-label="Settings navigation"
        >
          {["Edit Profile", "Account", "Billing (soon)", "Subscriptions (soon)"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setActiveMenuItem(item)}
                className={`flex h-10 items-center gap-2 px-2 py-3 w-full rounded-md transition
                  ${activeMenuItem === item ? "bg-coolgray-10" : "hover:bg-coolgray-10/60"}`}
                aria-current={activeMenuItem === item ? "page" : undefined}
              >
                <span className="flex-1 font-other-menu-m text-coolgray-90">
                  {item}
                </span>
              </button>
            )
          )}
        </nav>

        {/* main content */}
        <main className="flex flex-col w-[700px] items-start gap-4">
          {activeMenuItem === "Edit Profile" && (
            <>
              {/* profile photo */}
              <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
                <div className="flex-col items-start justify-center gap-4 flex w-full">
                  <h2 className="font-heading-6 text-coolgray-90">Profile Photo</h2>
                </div>

                <div className="flex items-start gap-12 w-full">
                  <div className="inline-flex items-center gap-6 pr-12 border-r border-coolgray-20">
                    <div
                      className="flex w-24 h-24 items-center justify-center bg-coolgray-10 rounded-full overflow-hidden"
                      role="img"
                      aria-label="Profile photo"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Profile avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User />
                      )}
                    </div>

                    <div className="inline-flex flex-col items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={onFileChange}
                      />
                      <button
                        type="button"
                        className="inline-flex h-12 items-center justify-center px-4 border-2 border-primary-60 text-primary-60 disabled:opacity-60"
                        onClick={onPickFile}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading…" : "Upload Photo"}
                      </button>

                      <button
                        type="button"
                        className="text-primary-90 disabled:opacity-60"
                        onClick={onRemoveAvatar}
                        disabled={uploading || !avatarPath}
                      >
                        remove
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2 pr-12 flex-1">
                    <div className="font-body-l text-coolgray-90">Image requirements:</div>
                    <p className="font-body-s text-coolgray-90">
                      Min. 400 × 400px
                      <br />
                      Max. 2MB
                      <br />
                      Your face or company logo
                    </p>
                  </div>
                </div>
              </section>

              {/* form */}
              <section className="flex flex-col items-start gap-6 p-4 w-full bg-defaultwhite border border-coolgray-20">
                <div className="flex-col items-start justify-center gap-4 flex w-full">
                  <h2 className="font-heading-6 text-coolgray-90">User Details</h2>
                </div>

                {err && (
                  <p className="text-[13px] text-red-600 -mt-2">{err}</p>
                )}

                <form
                  className="flex flex-col w-[616px] items-start gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!saving) handleSave();
                  }}
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="flex flex-col gap-1 flex-1">
                      <label htmlFor="firstName" className="font-body-s text-coolgray-90">
                        First Name
                      </label>
                      <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                          placeholder=""
                          disabled={loading || saving}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-1">
                      <label htmlFor="lastName" className="font-body-s text-coolgray-90">
                        Last Name
                      </label>
                      <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                          placeholder=""
                          disabled={loading || saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="artistName" className="font-body-s text-coolgray-90">
                      Artist Name
                    </label>
                    <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                      <input
                        id="artistName"
                        type="text"
                        value={formData.artistName}
                        onChange={(e) => handleInputChange("artistName", e.target.value)}
                        className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                        placeholder=""
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="location" className="font-body-s text-coolgray-90">
                      Location
                    </label>
                    <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                        placeholder=""
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-full">
                    <label htmlFor="phoneNumber" className="font-body-s text-coolgray-90">
                      Phone Number
                    </label>
                    <div className="flex h-12 items-center gap-2 px-4 py-3 bg-coolgray-10 border-b border-coolgray-30">
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        className="flex-1 font-body-m text-coolgray-60 bg-transparent"
                        placeholder=""
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 w-full">
                    <button
                      type="submit"
                      disabled={loading || saving}
                      className="inline-flex h-12 items-center justify-center px-4 bg-primary-60 border-2 border-primary-60 text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </section>

              {showSuccessMessage && (
                <div
                  className="flex flex-col items-start pl-4 w-full border-l-[3px] border-default-success
                          bg-[linear-gradient(0deg,rgba(37,162,73,0.1)_0%,rgba(37,162,73,0.1)_100%),linear-gradient(0deg,#fff_0%,#fff_100%)]"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className="inline-flex h-12 items-center justify-center">
                      <Check />
                    </div>
                    <div className="flex flex-col items-start pt-3.5 flex-1">
                      <div className="flex items-center gap-2 w-full">
                        <div className="font-subtitle-s text-coolgray-90">
                          Successfully Saved.
                        </div>
                        <p className="font-body-s text-coolgray-90">
                          Your profile settings have been saved.
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex h-12 items-center">
                      <button
                        onClick={handleCloseSuccess}
                        className="grid w-12 h-12 place-items-center"
                        aria-label="Close success message"
                      >
                        <Close />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeMenuItem === "Account" && <AccountPanel />}
          {activeMenuItem === "Billing" && <BillingPanel />}
          {activeMenuItem === "Subscriptions" && <SubscriptionsPanel />}
        </main>
      </div>
    </div>
  );
};
