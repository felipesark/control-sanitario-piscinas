import Link from "next/link";

const links = [
  { href: "/", label: "Inicio", icon: "H" },
  { href: "/dashboard", label: "Panel", icon: "D" },
  { href: "/registro", label: "Registro", icon: "R" },
  { href: "/historial", label: "Historial", icon: "L" },
  { href: "/suscripcion", label: "Cuenta", icon: "U" },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {links.map((link) => {
          const isActive = active === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-sm font-bold leading-none" aria-hidden>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
