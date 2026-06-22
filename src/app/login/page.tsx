import Link from "next/link";
import { AccessCodeForm } from "@/components/landing/AccessCodeForm";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-stage" aria-labelledby="login-title">
        <div className="login-visual" aria-hidden="true">
          <div className="login-visual-panel">
            <span>AI EDU Showroom</span>
            <strong>수업 앱 라이브러리</strong>
          </div>
          <div className="login-visual-chips">
            <span>수업 도구</span>
            <span>AI 챗봇</span>
            <span>피드백</span>
          </div>
        </div>

        <div className="login-panel">
          <Link className="login-home-link" href="/">
            쇼룸 홈
          </Link>
          <div className="login-copy">
            <span className="login-kicker">연수 전용</span>
            <h1 className="login-title" id="login-title">
              쇼룸 입장
            </h1>
            <p>연수 코드를 입력하고 교실용 웹 어플리케이션을 확인하세요.</p>
          </div>
          <AccessCodeForm />
        </div>
      </section>
    </main>
  );
}
