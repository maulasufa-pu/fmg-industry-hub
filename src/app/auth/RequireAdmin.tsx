// src/app/auth/RequireAdmin.tsx
"use client";
import React from "react";
import RequireRole from "./RequireRole";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole required="admin" redirectOnForbidden wakeEventName="admin-wake">
      {children}
    </RequireRole>
  );
}
