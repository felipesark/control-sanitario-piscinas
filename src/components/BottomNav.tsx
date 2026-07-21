import Link from "next/link";
import { MOBILE_NAV } from "@/lib/nav";

/** @deprecated Use AppShell. Kept so old imports do not break. */
export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {MOBILE_NAV.map((link) => {
          const isActive = active === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
