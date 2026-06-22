"use client";

import { ArrowLeft, DoorOpen, Library, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ACCESS_STORAGE_KEY } from "@/lib/access";

type HeaderProps = {
  backHref?: string;
  backLabel?: string;
};

export function Header({ backHref, backLabel = "뒤로" }: HeaderProps) {
  const router = useRouter();

  async function leaveShowroom() {
    await fetch("/api/logout", { method: "POST" });
    window.sessionStorage.removeItem(ACCESS_STORAGE_KEY);
    window.dispatchEvent(new Event("showroom:access-change"));
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link className="icon-button" href={backHref} aria-label={backLabel} title={backLabel}>
              <ArrowLeft size={19} />
            </Link>
          ) : (
            <Link className="brand-mark" href="/library" aria-label="AI EDU Showroom">
              <DoorOpen size={20} />
            </Link>
          )}
          <Link href="/library" className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--ink)]">
              AI EDU Showroom
            </span>
            <span className="block truncate text-xs font-normal text-[var(--muted)]">
              교사 연수 앱 라이브러리
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          <Link className="button-secondary hidden sm:inline-flex" href="/library">
            <Library size={17} />
            라이브러리
          </Link>
          <button className="icon-button" type="button" onClick={leaveShowroom} aria-label="나가기" title="나가기">
            <LogOut size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}
