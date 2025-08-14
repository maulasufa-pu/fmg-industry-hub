// src/components/SettingsSection.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { User, Check, Close } from "@/icons";
import NextImage from "next/image"; // ⬅️ pakai alias, biar tidak bentrok dengan DOM Image
import { getSupabaseClient } from "@/lib/supabase/client";

import AccountPanel from "@/components/settings/AccountPanel";
import BillingPanel from "@/components/settings/BillingPanel";
import SubscriptionsPanel from "@/components/settings/SubscriptionsPanel";

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
const USE_PUBLIC_BUCKET = true;

type MenuKey = "profile" | "account" | "billing" | "subscriptions";

const MENU: Array<{ key: MenuKey; label: string }> = [
  { key: "profile", label: "Edit Profile" },
  { key: "account", label: "Account" },
  { key: "billing", label: "Billing (soon)" },
  { key: "subscriptions", label: "Subscriptions (soon)" },
];

export const SettingsSection = (): React.JSX.Element => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef<boolean>(true);

  const [activeKey, setActiveKey] = useState<MenuKey>("profile");
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    artistName: "",
    location: "",
    phoneNumber: "",
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Buat URL akses avatar dari path
  const refreshAvatarUrl = useCallback(
    async (path: string | null) => {
      if (!mountedRef.current) return;
      if (!path) {
        setAvatarUrl(null);
        return;
      }
      if (USE_PUBLIC_BUCKET) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setAvatarUrl(data?.publicUrl ?? null);
      } else {
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
        setAvatarUrl(!error ? data?.signedUrl ?? null : null);
      }
    },
    [supabase]
  );

  // Ambil dimensi gambar dengan DOM <img> supaya tidak bentrok dengan next/image
  const getImageSize = (file: File): Promise<{ w: number; h: number }> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const imgEl = document.createElement("img");
      imgEl.onload = () => {
        const w = imgEl.naturalWidth;
        const h = imgEl.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ w, h });
      };
      imgEl.onerror = (_ev: Event | string) => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load error"));
      };
      imgEl.src = url;
    });

  // Load profile
  useEffect(() => {
    mountedRef.current = true;
    let aborted = false;

    (async () => {
      setLoading(true);
      setErr(null);

      const { data: usrRes, error: uErr } = await supabase.auth.getUser();
      if (aborted) return;
      if (uErr) {
        setErr(uErr.message);
        setLoading(false);
        return;
      }
      const user = usrRes?.user;
      if (!user) {
        setErr("Not authenticated.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, artist_name, location, phone_number, avatar_path")
        .eq("id", user.id)
        .maybeSingle();

      if (aborted) return;

      if (error) {
        setErr(error.message);
      } else if (data) {
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

    return () => {
      aborted = true;
      mountedRef.current = false;
    };
  }, [supabase, refreshAvatarUrl]);

  const handleInputChange = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setShowSuccessMessage(false);
    setErr(null);

    const { data: usrRes, error: uErr } = await supabase.auth.getUser();
    if (uErr) {
      setErr(uErr.message);
      setSaving(false);
      return;
    }
    const user = usrRes?.user;
    if (!user) {
      setErr("Session not found.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        artist_name: formData.artistName || null,
        location: formData.location || null,
        phone_number: formData.phoneNumber || null,
        avatar_path: avatarPath || null,
      },
      { onConflict: "id" }
    );

    if (error) setErr(error.message);
    else setShowSuccessMessage(true);

    setSaving(false);
  };

  // Upload
  const onPickFile = () => fileInputRef.current?.click();
  const resetFileInput = (el: HTMLInputElement | null) => {
    if (el) el.value = "";
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setErr(null);
    // 1) Ukuran
    if (file.size > MAX_BYTES) {
      setErr("Max file size is 2MB.");
      resetFileInput(e.target);
      return;
    }
    // 2) Tipe
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      setErr("Only PNG, JPG/JPEG, or WEBP are allowed.");
      resetFileInput(e.target);
      return;
    }
    // 3) Dimensi
    try {
      const { w, h } = await getImageSize(file);
      if (w < MIN_W || h < MIN_H) {
        setErr(`Minimum ${MIN_W}×${MIN_H}px. Your image is ${w}×${h}px.`);
        resetFileInput(e.target);
        return;
      }
    } catch {
      setErr("Failed to read image.");
      resetFileInput(e.target);
      return;
    }

    setUploading(true);
    try {
      const { data: usrRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = usrRes?.user;
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

      const { error: dbErr } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarPath(path);
      await refreshAvatarUrl(path);
      setShowSuccessMessage(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      resetFileInput(e.target);
    }
  };

  // Remove avatar
  const onRemoveAvatar = async () => {
    setUploading(true);
    setErr(null);
    try {
      const { data: usrRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      const user = usrRes?.user;
      if (!user) throw new Error("Not authenticated.");

      if (avatarPath) {
        await supabase.storage.from(BUCKET).remove([avatarPath]).catch(() => {});
      }

      const { error: dbErr } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setAvatarPath(null);
      setAvatarUrl(null);
      setShowSuccessMessage(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to remove photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseSuccess = () => setShowSuccessMessage(false);

  return (
    <div className="relative flex flex-1 grow flex-col items-start gap-6 p-6">
      <div className="relative self-stretch w-full">
        <div className="flex items-center justify-between">
          <h1 className="font-heading-2 text-coolgray-90">Settings</h1>
          {(loading || uploading) && (
            <p className="text-xs text-coolgray-60">{loading ? "Loading profile…" : "Uploading…"}</p>
          )}
        </div>
      </div>

      <div className="relative flex w-full items-start gap-6 self-stretch">
        {/* left nav */}
        <nav
          className="flex w-[220px] flex-col items-start border border-coolgray-20 bg-defaultwhite p-2"
          role="navigation"
          aria-label="Settings navigation"
        >
          {MENU.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              className={`flex h-10 w-full items-center gap-2 rounded-md px-2 py-3 transition ${
                activeKey === item.key ? "bg-coolgray-10" : "hover:bg-coolgray-10/60"
              }`}
              aria-current={activeKey === item.key ? "page" : undefined}
            >
              <span className="flex-1 font-other-menu-m text-coolgray-90">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* main content */}
        <main className="flex w-[700px] flex-col items-start gap-4">
          {activeKey === "profile" && (
            <>
              {/* profile photo */}
              <section className="w-full border border-coolgray-20 bg-defaultwhite p-4">
                <h2 className="font-heading-6 text-coolgray-90">Profile Photo</h2>

                <div className="mt-6 flex w-full items-start gap-12">
                  <div className="inline-flex items-center gap-6 border-r border-coolgray-20 pr-12">
                    <div
                      className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-coolgray-10"
                      role="img"
                      aria-label="Profile photo"
                    >
                      {avatarUrl ? (
                        <NextImage
                          src={avatarUrl}
                          alt="Profile avatar"
                          className="h-full w-full object-cover"
                          width={96}
                          height={96}
                          onError={() => setAvatarUrl(null)}
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
                        className="inline-flex h-12 items-center justify-center border-2 border-primary-60 px-4 text-primary-60 disabled:opacity-60"
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

                  <div className="flex flex-1 flex-col justify-center gap-2 pr-12">
                    <div className="font-body-l text-coolgray-90">Image requirements:</div>
                    <p className="font-body-s text-coolgray-90">
                      Min. {MIN_W} × {MIN_H}px
                      <br />
                      Max. 2MB
                      <br />
                      Your face or company logo
                    </p>
                  </div>
                </div>
              </section>

              {/* form */}
              <section className="w-full border border-coolgray-20 bg-defaultwhite p-4">
                <h2 className="font-heading-6 text-coolgray-90">User Details</h2>

                {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}

                <form
                  className="mt-4 flex w-[616px] flex-col items-start gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!saving) void handleSave();
                  }}
                >
                  <div className="flex w-full items-start gap-4">
                    <div className="flex flex-1 flex-col gap-1">
                      <label htmlFor="firstName" className="font-body-s text-coolgray-90">
                        First Name
                      </label>
                      <div className="flex h-12 items-center gap-2 border-b border-coolgray-30 bg-coolgray-10 px-4 py-3">
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="flex-1 bg-transparent font-body-m text-coolgray-60"
                          disabled={loading || saving}
                        />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <label htmlFor="lastName" className="font-body-s text-coolgray-90">
                        Last Name
                      </label>
                      <div className="flex h-12 items-center gap-2 border-b border-coolgray-30 bg-coolgray-10 px-4 py-3">
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="flex-1 bg-transparent font-body-m text-coolgray-60"
                          disabled={loading || saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="artistName" className="font-body-s text-coolgray-90">
                      Artist Name
                    </label>
                    <div className="flex h-12 items-center gap-2 border-b border-coolgray-30 bg-coolgray-10 px-4 py-3">
                      <input
                        id="artistName"
                        type="text"
                        value={formData.artistName}
                        onChange={(e) => handleInputChange("artistName", e.target.value)}
                        className="flex-1 bg-transparent font-body-m text-coolgray-60"
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="location" className="font-body-s text-coolgray-90">
                      Location
                    </label>
                    <div className="flex h-12 items-center gap-2 border-b border-coolgray-30 bg-coolgray-10 px-4 py-3">
                      <input
                        id="location"
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="flex-1 bg-transparent font-body-m text-coolgray-60"
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="phoneNumber" className="font-body-s text-coolgray-90">
                      Phone Number
                    </label>
                    <div className="flex h-12 items-center gap-2 border-b border-coolgray-30 bg-coolgray-10 px-4 py-3">
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        className="flex-1 bg-transparent font-body-m text-coolgray-60"
                        disabled={loading || saving}
                      />
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end gap-4">
                    <button
                      type="submit"
                      disabled={loading || saving}
                      className="inline-flex h-12 items-center justify-center border-2 border-primary-60 bg-primary-60 px-4 text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </section>

              {showSuccessMessage && (
                <div
                  className="w-full border-l-[3px] border-default-success bg-[linear-gradient(0deg,rgba(37,162,73,0.1)_0%,rgba(37,162,73,0.1)_100%),linear-gradient(0deg,#fff_0%,#fff_100%)] pl-4"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex w-full items-start gap-4">
                    <div className="inline-flex h-12 items-center justify-center">
                      <Check />
                    </div>
                    <div className="flex flex-1 flex-col items-start pt-3.5">
                      <div className="flex w-full items-center gap-2">
                        <div className="font-subtitle-s text-coolgray-90">Successfully Saved.</div>
                        <p className="font-body-s text-coolgray-90">Your profile settings have been saved.</p>
                      </div>
                    </div>
                    <div className="inline-flex h-12 items-center">
                      <button
                        onClick={handleCloseSuccess}
                        className="grid h-12 w-12 place-items-center"
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

          {activeKey === "account" && <AccountPanel />}
          {activeKey === "billing" && <BillingPanel />}
          {activeKey === "subscriptions" && <SubscriptionsPanel />}
        </main>
      </div>
    </div>
  );
};
