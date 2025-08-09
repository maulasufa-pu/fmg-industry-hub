import LogoSection from "@/components/LogoSection";
import HeaderSection from "@/components/HeaderSection";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <LogoSection />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <HeaderSection />
        <main className="p-6 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
