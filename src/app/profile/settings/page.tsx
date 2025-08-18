"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { getSupabaseClient } from "@/lib/supabase/client";
import { User, Camera, Save, PictureEdit, MapMarker, Phone, File, Check, ShieldCheck } from "@/icons";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Custom header component for profile settings
const ProfileHeader = () => {
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        {
          y: -100,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }
  }, []);

  return (
    <motion.header
      ref={headerRef}
      className="relative z-50 bg-white dark:bg-gray-900/10 backdrop-blur-md border-[var(--border)] border-white dark:border-gray-700 dark:border-gray-700/20 shadow-lg dark:shadow-slate-900/25"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back Button with Animation */}
          <motion.button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900/20  text-gray-700 dark:text-gray-200 hover:bg-white dark:bg-gray-900/30 transition-all"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ x: -2 }}
              transition={{ duration: 0.2 }}
            >
              ←
            </motion.div>
            Back
          </motion.button>

          {/* Title with Floating Animation */}
          <motion.div
            className="absolute left-1/2 transform -translate-x-1/2"
            animate={{ 
              y: [0, -2, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 dark:text-gray-100">Profile Settings</h1>
          </motion.div>

          {/* Home Button with Pulse */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg dark:shadow-slate-900/25"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🏠
              </motion.div>
              Home
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Animated underline */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.header>
  );
};

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
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
  
  // Email management states
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [emailConfirming, setEmailConfirming] = useState(false);
  const [loginProvider, setLoginProvider] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  // GSAP Animation untuk card entrance
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          y: 50,
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [loading]);

  // GSAP Animation untuk avatar hover
  useEffect(() => {
    if (avatarRef.current) {
      const avatar = avatarRef.current;
      
      avatar.addEventListener("mouseenter", () => {
        gsap.to(avatar, {
          scale: 1.1,
          rotation: 3,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      
      avatar.addEventListener("mouseleave", () => {
        gsap.to(avatar, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      });
    }
  }, [avatarUrl]);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        artist_name: data.artist_name || "",
        email: data.email || "",
        location: data.location || "",
        phone_number: data.phone_number || "",
      });

      // Detect login provider dari user metadata atau identities
      if (user.app_metadata?.provider) {
        setLoginProvider(user.app_metadata.provider);
      } else if (user.identities && user.identities.length > 0) {
        setLoginProvider(user.identities[0].provider);
      } else {
        setLoginProvider("email");
      }

      // Load avatar
      if (data.avatar_path) {
        await refreshAvatarUrl(data.avatar_path);
      } else if (data.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAvatarUrl = async (path: string) => {
    if (USE_PUBLIC_BUCKET) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } else {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
      if (!error && data) {
        setAvatarUrl(data.signedUrl);
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          artist_name: formData.artist_name || null,
          location: formData.location || null,
          phone_number: formData.phone_number || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      setSuccess(true);
      
      // GSAP success animation
      if (formRef.current) {
        gsap.fromTo(
          formRef.current,
          { scale: 1 },
          { 
            scale: 1.02,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          }
        );
      }
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  // Handle email change dengan konfirmasi
  const handleEmailChange = async () => {
    if (!profile || formData.email === profile.email) return;
    
    try {
      setEmailConfirming(true);
      
      // Update email via Supabase Auth (akan kirim konfirmasi email)
      const { error } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (error) throw error;

      setEmailVerificationSent(true);
      setIsEmailEditing(false);
      
      // Show notification
      setTimeout(() => {
        setEmailVerificationSent(false);
      }, 5000);
      
    } catch (error) {
      console.error("Error updating email:", error);
      // Reset email to original value
      setFormData(prev => ({ ...prev, email: profile.email }));
    } finally {
      setEmailConfirming(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setUploading(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      
      // Upload via API route with auth header
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      
      // Update local state
      await refreshAvatarUrl(result.path);
      setProfile(prev => prev ? { ...prev, avatar_path: result.path } : null);
      
      // GSAP animation for avatar update
      if (avatarRef.current) {
        gsap.fromTo(
          avatarRef.current,
          { scale: 1.2, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getRoleDisplay = (profile: UserProfile) => {
    const allRoles = [profile.main_role, ...(profile.staff_role || [])];
    if (allRoles.includes("owner")) return "Owner";
    if (allRoles.includes("admin")) return "Admin";
    return profile.main_role?.charAt(0).toUpperCase() + profile.main_role?.slice(1) || "User";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br  from-gray-50 to-blue-50 flex items-center justify-center overflow-auto">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br  from-gray-50 to-purple-50 overflow-auto">
      {/* Custom Header */}
      <ProfileHeader />
      
      {/* Main Content */}
      <div className="pt-4 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8 pt-4"
        >
          <motion.p 
            className="text-gray-600 dark:text-gray-300 dark:text-gray-300 text-lg"
            animate={{ 
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            ✨ Manage your personal information and preferences ✨
          </motion.p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          ref={cardRef}
          layout
          className="bg-white dark:bg-gray-900 rounded-3xl shadow dark:shadow-gray-800/25 dark:shadow dark:shadow-gray-800/25-gray-800/25-2xl overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white relative overflow-hidden">
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-gray-900/10 rounded-full -translate-y-32 translate-x-32"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Avatar */}
              <div className="relative">
                <motion.div
                  ref={avatarRef}
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 dark:border-gray-700/20 cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile Avatar"
                      fill
                      priority
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-white dark:bg-gray-900/20 flex items-center justify-center">
                      <User className="text-white/80" />
                    </div>
                  )}
                  
                  <motion.div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    whileHover={{ opacity: 1 }}
                  >
                    <Camera className="text-white" />
                  </motion.div>
                </motion.div>
                
                {uploading && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-32 h-32 border-4 border-white dark:border-gray-700 dark:border-gray-700/30 border-t-white rounded-full animate-spin" />
                  </motion.div>
                )}
              </div>

              {/* User Info */}
              <div className="text-center md:text-left">
                <motion.h2 
                  className="text-3xl font-bold mb-2"
                  layout
                >
                  {profile?.first_name} {profile?.last_name}
                </motion.h2>
                {profile?.artist_name && (
                  <motion.p className="text-xl text-blue-200 mb-2" layout>
                    &quot;{profile.artist_name}&quot;
                  </motion.p>
                )}
                <motion.div 
                  className="inline-block bg-white dark:bg-gray-900/20 px-4 py-2 rounded-full text-sm font-medium"
                  layout
                >
                  {profile && getRoleDisplay(profile)}
                </motion.div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Form Section */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 dark:text-gray-100">Personal Information</h3>
              
              <motion.button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                    if (formRef.current) {
                      gsap.fromTo(
                        formRef.current.querySelectorAll("input"),
                        { scale: 1 },
                        { scale: 1.02, duration: 0.2, stagger: 0.05, yoyo: true, repeat: 1 }
                      );
                    }
                  }
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isEditing
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={saving}
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white dark:border-gray-700 dark:border-gray-700 border-t-transparent rounded-full"
                  />
                ) : isEditing ? (
                  <Save className="" />
                ) : (
                  <PictureEdit className="" />
                )}
                {isEditing ? "Save Changes" : "Edit Profile"}
              </motion.button>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800 flex items-center gap-2"
                >
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      ✓
                    </motion.div>
                  </div>
                  Profile updated successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Verification Message */}
            <AnimatePresence>
              {emailVerificationSent && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-xl text-blue-800 flex items-center gap-2"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      ✉️
                    </motion.div>
                  </div>
                  Email verification sent! Please check your inbox to confirm the new email address.
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form 
              ref={formRef}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              layout
            >
              {/* First Name */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <User className="" />
                  First Name
                </label>
                <motion.input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    isEditing
                      ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Last Name */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <User className="" />
                  Last Name
                </label>
                <motion.input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    isEditing
                      ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Artist Name */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <File className="" />
                  Artist Name
                </label>
                <motion.input
                  type="text"
                  value={formData.artist_name}
                  onChange={(e) => handleInputChange("artist_name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your stage/artist name"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    isEditing
                      ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Email with confirmation */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Email Address
                  {loginProvider && loginProvider !== "email" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {loginProvider === "google" ? "Google" : loginProvider}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <motion.input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEmailEditing && !isEditing}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      isEmailEditing || isEditing
                        ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                        : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    }`}
                    whileFocus={{ scale: 1.02 }}
                  />
                  {isEditing && formData.email !== profile?.email && (
                    <motion.button
                      onClick={handleEmailChange}
                      disabled={emailConfirming}
                      className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {emailConfirming ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white dark:border-gray-700 dark:border-gray-700 border-t-transparent rounded-full"
                        />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      Confirm
                    </motion.button>
                  )}
                </div>
                {loginProvider === "email" && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 dark:text-gray-300">
                    ✉️ Signed up with email - can be changed with confirmation
                  </p>
                )}
                {loginProvider && loginProvider !== "email" && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 dark:text-gray-300">
                    🔗 Signed up with {loginProvider === "google" ? "Google" : loginProvider} - email changes require confirmation
                  </p>
                )}
              </motion.div>

              {/* Location */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <MapMarker className="" />
                  Location
                </label>
                <motion.input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your city, country"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    isEditing
                      ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Phone */}
              <motion.div layout className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Phone className="" />
                  Phone Number
                </label>
                <motion.input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your phone number"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                    isEditing
                      ? "border-blue-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                      : "border-gray-200 dark:border-gray-700 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
