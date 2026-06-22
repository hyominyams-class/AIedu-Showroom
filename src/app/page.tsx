import { HeroSection } from "@/components/landing/HeroSection";
import { LandingIntroGate } from "@/components/landing/LandingIntroGate";

export default function Home() {
  return (
    <LandingIntroGate>
      <HeroSection />
    </LandingIntroGate>
  );
}
