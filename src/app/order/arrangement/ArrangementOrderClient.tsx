"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import CreateProjectPopover from "@/app/ui/panel/projects/CreateProjectPopover";
import { ARRANGEMENT_SERVICE_KEY } from "@/lib/arrangement";

export default function ArrangementOrderClient() {
  const router = useRouter();
  const submittedRef = useRef(false);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <CreateProjectPopover
        open
        initialServiceKeys={[ARRANGEMENT_SERVICE_KEY]}
        requestIntent="arrangement"
        onClose={() => {
          if (!submittedRef.current) router.push("/services");
        }}
        onSubmitted={() => {
          submittedRef.current = true;
          router.replace("/client/projects");
        }}
      />
    </main>
  );
}
