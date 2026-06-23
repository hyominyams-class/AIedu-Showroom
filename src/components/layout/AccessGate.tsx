"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCESS_STORAGE_KEY } from "@/lib/access";

type AccessGateProps = {
  children: React.ReactNode;
};

export function AccessGate({ children }: AccessGateProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (window.sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true") {
        setHasAccess(true);
        return;
      }

      try {
        const response = await fetch("/api/access-status", { cache: "no-store" });
        const data = (await response.json()) as { hasAccess?: boolean };

        if (!active) return;

        if (data.hasAccess) {
          window.sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
          setHasAccess(true);
        } else {
          setHasAccess(false);
          router.replace("/login");
        }
      } catch {
        if (!active) return;
        setHasAccess(false);
        router.replace("/login");
      }
    }

    checkAccess();

    function handleAccessChange() {
      if (window.sessionStorage.getItem(ACCESS_STORAGE_KEY) !== "true") {
        setHasAccess(false);
        router.replace("/login");
      }
    }

    window.addEventListener("showroom:access-change", handleAccessChange);

    return () => {
      active = false;
      window.removeEventListener("showroom:access-change", handleAccessChange);
    };
  }, [router]);

  if (!hasAccess) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--surface)] px-6 text-[var(--ink)]">
        <div className="panel max-w-sm p-6 text-center">
          <p className="text-sm font-normal text-[var(--muted)]">입장 확인 중</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
