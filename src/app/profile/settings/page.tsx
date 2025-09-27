"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { getSupabaseClient } from "@/lib/supabase/client";
import { User, Camera, Save, PictureEdit, MapMarker, Phone, File, ShieldCheck } from "@/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ProfileHeader = () => {
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/60 bg-white/90 dark:bg-neutral-950/90"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <motion.button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm border border-black/10 dark:border-white/10 bg-white text-neutral-800 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-white/90 dark:hover:bg-neutral-800 transition"
            whileHover={{ scale: 1.03, x: -2 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Back"
          >
            <span aria-hidden>←</span>
            Back
          </motion.button>

          <motion.h1
            className="pointer-events-none text-base font-semibold text-neutral-900 dark:text-white"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            Profile Settings
          </motion.h1>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_8px_30px_rgba(99,102,241,.35)] hover:opacity-95 transition"
            >
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                🏠
              </motion.span>
              Home
            </Link>
          </motion.div>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-indigo-500/70 via-fuchsia-500/70 to-cyan-400/70" />
    </motion.header>
  );
};


type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  username?: string;
  artist_name?: string;
  email: string;
  location?: string;
  phone_number?: string;
  avatar_path?: string;
  avatar_url?: string;
  main_role: string;
  staff_role?: string[];
};

type FormData = {
  first_name: string;
  last_name: string;
  name: string;
  username: string;
  artist_name: string;
  email: string;
  location: string;
  phone_number: string;
};

const BUCKET = "avatars";
const USE_PUBLIC_BUCKET = true;


export default function ProfileSettingsPage() {
  const supabase = getSupabaseClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    name: "",
    username: "",
    artist_name: "",
    email: "",
    location: "",
    phone_number: "",
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [emailConfirming, setEmailConfirming] = useState(false);
  const [loginProvider, setLoginProvider] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  useEffect(() => {
    if (!loading && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 32, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [loading]);

  useEffect(() => {
    if (!avatarRef.current) return;
    const el = avatarRef.current;
    const enter = () => gsap.to(el, { scale: 1.06, rotation: 1.5, duration: 0.25, ease: "power2.out" });
    const leave = () => gsap.to(el, { scale: 1, rotation: 0, duration: 0.25, ease: "power2.out" });
    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [avatarUrl]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (error) throw error;

        setProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          name: data.name || "",
          username: data.username || "",
          artist_name: data.artist_name || "",
          email: data.email || "",
          location: data.location || "",
          phone_number: data.phone_number || "",
        });

        if (user.app_metadata?.provider) setLoginProvider(user.app_metadata.provider);
        else if (user.identities?.length) setLoginProvider(user.identities[0].provider);
        else setLoginProvider("email");

        if (data.avatar_path) await refreshAvatarUrl(data.avatar_path);
        else if (data.avatar_url) setAvatarUrl(data.avatar_url);
      } catch (e) {
        console.error("Load profile error:", e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAvatarUrl = async (path: string) => {
    if (USE_PUBLIC_BUCKET) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      return;
    }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
    if (!error && data) setAvatarUrl(data.signedUrl);
  };

  const handleInputChange = (field: keyof FormData, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!profile) return;
    try {
      setSaving(true);

      let finalUsername = formData.username?.trim() || null;
      if (finalUsername) {
        const { data: gen, error: genErr } = await supabase.rpc("gen_unique_username", {
          base_in: finalUsername,
          id_in: profile.id,
        });
        if (genErr) throw genErr;
        finalUsername = gen || finalUsername;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          name: formData.name || null,
          username: finalUsername,
          artist_name: formData.artist_name || null,
          location: formData.location || null,
          phone_number: formData.phone_number || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...formData, username: finalUsername || undefined } : null));
      setIsEditing(false);
      setSuccess(true);

      if (formRef.current) {
        gsap.fromTo(formRef.current, { scale: 1 }, { scale: 1.02, duration: 0.18, yoyo: true, repeat: 1 });
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error("Save profile error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!profile || formData.email === profile.email) return;
    try {
      setEmailConfirming(true);
      const siteUrl =
        (typeof window !== "undefined" ? window.location.origin : "") ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "";

      const { error } = await supabase.auth.updateUser(
        { email: formData.email },
        { emailRedirectTo: `${siteUrl}/auth/callback` }
      );
      if (error) throw error;

      setEmailVerificationSent(true);
      setIsEmailEditing(false);
      setTimeout(() => setEmailVerificationSent(false), 5000);
    } catch (e) {
      console.error("Update email error:", e);
      setFormData((p) => ({ ...p, email: profile.email }));
    } finally {
      setEmailConfirming(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });

      if (!res.ok) throw new Error((await res.json())?.error || "Upload failed");
      const result = await res.json();

      await refreshAvatarUrl(result.path);
      setProfile((p) => (p ? { ...p, avatar_path: result.path } : null));

      if (avatarRef.current) {
        gsap.fromTo(avatarRef.current, { scale: 1.2, opacity: 0.7 }, { scale: 1, opacity: 1, duration: 0.45 });
      }
    } catch (e) {
      console.error("Upload avatar error:", e);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getRoleDisplay = (p: UserProfile) => {
    const all = [p.main_role, ...(p.staff_role || [])];
    if (all.includes("owner")) return "Owner";
    if (all.includes("admin")) return "Admin";
    return p.main_role ? p.main_role[0]?.toUpperCase() + p.main_role.slice(1) : "User";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-gradient-to-br from-white to-indigo-50 dark:from-neutral-950 dark:to-neutral-900">
        <motion.div
          className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-auto bg-gradient-to-br from-white to-indigo-50 dark:from-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-20 h-[44rem] w-[44rem] rounded-full bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-44 -right-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-400/10 to-sky-400/10 blur-3xl" />
      </div>

      <ProfileHeader />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 pt-6">
        <motion.p
          className="mx-auto mb-6 max-w-2xl text-center text-neutral-600 dark:text-neutral-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          ✨ Manage your personal information and preferences ✨
        </motion.p>

        <motion.div
          ref={cardRef}
          layout
          className="rounded-3xl p-[1px] bg-[linear-gradient(180deg,rgba(0,0,0,.08),transparent_40%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.12),transparent_40%)] shadow-[0_1px_0_rgba(255,255,255,.15)] dark:shadow-[0_1px_0_rgba(255,255,255,.06)]"
        >
          <div className="overflow-hidden rounded-[calc(theme(borderRadius.3xl)-1px)] bg-white dark:bg-neutral-950">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 p-6 sm:p-8 text-white">
              <motion.div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <motion.div
                    ref={avatarRef}
                    className="relative h-28 w-28 sm:h-32 sm:w-32 cursor-pointer overflow-hidden rounded-full border-4 border-white/90"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Profile Avatar" fill priority className="object-cover" unoptimized />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-white/10">
                        <User />
                      </div>
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition hover:bg-black/40 hover:opacity-100">
                      <Camera className="text-white" />
                    </div>
                  </motion.div>

                  {uploading && (
                    <motion.div
                      className="absolute inset-0 grid place-items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="h-28 w-28 sm:h-32 sm:w-32 animate-spin rounded-full border-4 border-white/40 border-t-white" />
                    </motion.div>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <motion.h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" layout>
                    {profile?.first_name} {profile?.last_name}
                  </motion.h2>
                  {profile?.artist_name && (
                    <motion.p className="mt-1 text-indigo-100" layout>
                      &quot;{profile.artist_name}&quot;
                    </motion.p>
                  )}
                  <motion.span
                    className="mt-3 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur"
                    layout
                  >
                    {profile && getRoleDisplay(profile)}
                  </motion.span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Upload avatar"
              />
            </div>

            <div className="p-5 sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold">Personal Information</h3>
                <motion.button
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                      if (formRef.current) {
                        const inputs = formRef.current.querySelectorAll("input,textarea,select");
                        gsap.fromTo(inputs, { scale: 1 }, { scale: 1.02, duration: 0.18, stagger: 0.04, yoyo: true, repeat: 1 });
                      }
                    }
                  }}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white",
                    isEditing
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_8px_30px_rgba(99,102,241,.35)] hover:opacity-95",
                  ].join(" ")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving}
                >
                  {saving ? (
                    <motion.span
                      className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      aria-hidden
                    />
                  ) : isEditing ? (
                    <Save />
                  ) : (
                    <PictureEdit />
                  )}
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </motion.button>
              </div>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    role="status"
                    aria-live="polite"
                    className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-200"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-white">✓</span>
                    Profile updated successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {emailVerificationSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    role="status"
                    aria-live="polite"
                    className="mb-6 flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-3 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-200"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white">✉️</span>
                    Email verification sent! Please check your inbox.
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.form ref={formRef} className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2" layout>
                <Field
                  label="Display Name"
                  value={formData.name}
                  onChange={(v) => handleInputChange("name", v)}
                  isEditing={isEditing}
                />

                <Field
                  label="Username"
                  value={formData.username}
                  onChange={(v) => handleInputChange("username", v.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase())}
                  hint="Only letters/numbers, dot, underscore, minus. Must be unique."
                  isEditing={isEditing}
                />

                <Field label="First Name" icon={<User />} value={formData.first_name} onChange={(v) => handleInputChange("first_name", v)} isEditing={isEditing} />

                <Field label="Last Name" icon={<User />} value={formData.last_name} onChange={(v) => handleInputChange("last_name", v)} isEditing={isEditing} />

                <Field label="Artist Name" icon={<File />} value={formData.artist_name} onChange={(v) => handleInputChange("artist_name", v)} isEditing={isEditing} placeholder="Your stage/artist name" />

                <div className="space-y-2">
                  <Label>
                    <span className="inline-flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Email Address
                      {loginProvider && loginProvider !== "email" && (
                        <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                          {loginProvider === "google" ? "Google" : loginProvider}
                        </span>
                      )}
                    </span>
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(v) => handleInputChange("email", v)}
                      disabled={!isEmailEditing && !isEditing}
                    />
                    {isEditing && formData.email !== profile?.email && (
                      <motion.button
                        onClick={handleEmailChange}
                        disabled={emailConfirming}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                      >
                        {emailConfirming ? (
                          <motion.span
                            className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            aria-hidden
                          />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        Confirm
                      </motion.button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {loginProvider === "email"
                      ? "✉️ Signed up with email - can be changed with confirmation"
                      : `🔗 Signed up with ${loginProvider === "google" ? "Google" : loginProvider} - email changes require confirmation`}
                  </p>
                </div>

                <Field
                  label="Location"
                  icon={<MapMarker />}
                  value={formData.location}
                  onChange={(v) => handleInputChange("location", v)}
                  isEditing={isEditing}
                  placeholder="Your city, country"
                />

                <Field
                  label="Phone Number"
                  icon={<Phone />}
                  value={formData.phone_number}
                  onChange={(v) => handleInputChange("phone_number", v)}
                  isEditing={isEditing}
                  placeholder="Your phone number"
                />
              </motion.form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{children}</label>
);

const Input = ({
  value,
  onChange,
  disabled,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    className={[
      "w-full rounded-xl border-2 px-4 py-3 transition",
      disabled
        ? "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
        : "border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200/50 dark:border-indigo-600/30 dark:bg-neutral-950 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/20",
    ].join(" ")}
  />
);

const Field = ({
  label,
  icon,
  value,
  onChange,
  isEditing,
  placeholder,
  hint, 
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  placeholder?: string;
  hint?: React.ReactNode; 
}) => (
  <div className="space-y-2">
    <Label>
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </Label>
    <Input
      value={value}
      onChange={onChange}
      disabled={!isEditing}
      placeholder={placeholder}
    />
    {hint ? (
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {hint}
      </p>
    ) : null}
  </div>
);

