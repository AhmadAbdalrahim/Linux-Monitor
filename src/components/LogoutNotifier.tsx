"use client";

import { useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";

function Notifier() {
  const searchParams = useSearchParams();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;

    const logout = searchParams.get("logout");
    if (logout === "success") {
      shownRef.current = true;
      toast.success("Logged out successfully");
      // Clean up URL without reload
      window.history.replaceState(null, "", "/");
    }
  }, [searchParams]);

  return null;
}

export function LogoutNotifier() {
  return (
    <Suspense>
      <Notifier />
    </Suspense>
  );
}
