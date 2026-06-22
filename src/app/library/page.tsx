import { LibraryClient } from "@/components/library/LibraryClient";
import { AccessGate } from "@/components/layout/AccessGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function LibraryPage() {
  return (
    <AccessGate>
      <Header />
      <LibraryClient />
      <Footer />
    </AccessGate>
  );
}
