import React from "react";
import { SignUpSection } from "@/app/ui/SignUpSection";

import RedirectIfAuthenticated from "@/app/auth/RedirectIfAuthenticated";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignUpPage() {
  return (
    <>
      <RedirectIfAuthenticated />
      {
        <section className="relative left-1/2 right-1/2 -mx-[50dvw] w-[100dvw] bg-coolgray-10">
        <div className="flex items-start justify-center px-4 sm:px-6 py-8 sm:py-10">
            <SignUpSection />
        </div>
    </section>} </>
  );
}
