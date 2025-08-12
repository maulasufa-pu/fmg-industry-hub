import React from "react";
import { Suspense } from "react";
import { LoginSection } from "@/components/LoginSection";
import RedirectIfAuthenticated from "@/app/auth/RedirectIfAuthenticated";

export default function Login(): React.JSX.Element {
  return (
    <>
      <RedirectIfAuthenticated />
      {
        <section className="relative left-1/2 right-1/2 -mx-[50dvw] w-[100dvw] bg-coolgray-10">
        <div className="flex items-start justify-center px-4 sm:px-6 py-8 sm:py-10">
          <Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
            <LoginSection />
          </Suspense>
        </div>
        </section>
    }
    </>
  );
}