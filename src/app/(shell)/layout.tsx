import { Sidebar } from "@/components/shell/sidebar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gap-6 p-4">
      <Sidebar />
      <main className="min-w-0 flex-1 py-4 pr-2">{children}</main>
    </div>
  );
}
