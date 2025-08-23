import React from "react";
import ForgotPasswordPage from "../ui/main_container/forgotpassword";

import RedirectIfAuthenticated from "@/app/auth/RedirectIfAuthenticated";
import type { Metadata } from "next";
import { seoFromDB } from "@/lib/seo-loader";

export const metadata: Metadata = seoFromDB("/forgot-password");

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ForgotPassword() {
  return (
    <>
      <RedirectIfAuthenticated />
      {
        <section className="relative left-1/2 right-1/2 -mx-[50dvw] w-[100dvw] bg-coolgray-10">
        <div className="flex items-start justify-center px-4 sm:px-6 py-8 sm:py-10">
            <ForgotPasswordPage />
        </div>
    </section>} </>
  );
}
