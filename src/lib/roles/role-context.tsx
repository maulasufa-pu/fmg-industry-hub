// src/lib/roles/role-context.tsx
"use client";
import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/roles";

const Ctx = createContext<{ role: UserRole }>({ role: "guest" });
export const RoleProvider = Ctx.Provider;
export const useRole = () => useContext(Ctx);
