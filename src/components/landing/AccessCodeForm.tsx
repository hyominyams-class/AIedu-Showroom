"use client";

import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ACCESS_STORAGE_KEY } from "@/lib/access";

type AccessCodeFormProps = {
  showHeading?: boolean;
};

export function AccessCodeForm({ showHeading = true }: AccessCodeFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("입장 코드가 맞지 않습니다.");
      return;
    }

    window.sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
    window.dispatchEvent(new Event("showroom:access-change"));
    router.push("/library");
  }

  return (
    <form className="access-form" onSubmit={handleSubmit}>
      {showHeading ? (
        <div className="access-form-heading">
          <KeyRound size={18} />
          <span>연수 코드</span>
        </div>
      ) : null}
      <label className="sr-only" htmlFor="access-code">
        입장 코드
      </label>
      <div className="access-form-row">
        <input
          id="access-code"
          name="code"
          autoComplete="off"
          className="access-input"
          placeholder="입장 코드를 입력하세요"
          value={code}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "access-code-error" : undefined}
          onChange={(event) => setCode(event.target.value)}
        />
        <button className="button-primary min-w-32" type="submit" disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          쇼룸 입장
        </button>
      </div>
      {error ? (
        <p className="access-error" id="access-code-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
