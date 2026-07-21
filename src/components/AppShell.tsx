"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAV_GROUPS, MOBILE_NAV } from "@/lib/nav";

function NavIcon({ href, className = "h-5 w-5" }: { href: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (href) {
    case "/":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "/dashboard":
      return (
        <svg {...common}>
          <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        </svg>
      );
    case "/registro":
      return (
        <svg {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "/historial":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "/visitas":
      return (
        <svg {...common}>
          <path d="M8 21h8M12 17v4M6 4h12v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V4Z" />
        </svg>
      );
    case "/configuracion":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "/suscripcion":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      );
    case "/planes":
      return (
        <svg {...common}>
          <path d="M4 7h16v12H4zM8 7V5h8v2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function SidebarNav({
  active,
  collapsed,
  onNavigate,
}: {
  active: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {APP_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {group.title}
            </p>
          ) : null}
          <div className="space-y-1">
            {group.items.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    collapsed ? "justify-center px-2" : ""
                  } ${
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--deep)]"
                      : "text-[var(--foreground)]/80 hover:bg-[var(--foam)]/70 hover:text-[var(--deep)]"
                  }`}
                >
                  <NavIcon href={link.href} />
                  {!collapsed ? <span>{link.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

interface AppShellProps {
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
}

export function AppShell({
  active,
  title,
  subtitle,
  children,
  width = "default",
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [active]);

  const contentWidth =
    width === "wide" ? "max-w-7xl" : width === "narrow" ? "max-w-2xl" : "max-w-5xl";

  const crumb =
    APP_NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === active)?.label ?? title;

  return (
    <div
      className={`app-frame min-h-dvh bg-[var(--canvas)] ${collapsed ? "app-frame--collapsed" : ""}`}
    >
      {/* Desktop sidebar */}
      <aside className="app-sidebar relative hidden lg:flex">
        <div className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--deep)] text-sm font-bold text-white">
              CS
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold text-[var(--deep)]">
                  Control Sanitario
                </p>
                <p className="truncate text-xs text-[var(--muted)]">Antioquia</p>
              </div>
            ) : null}
          </div>

          <SidebarNav active={active} collapsed={collapsed} />

          <div className="border-t border-[var(--border)] p-3">
            {!collapsed ? (
              <Link
                href="/suscripcion"
                className="block rounded-xl bg-[var(--foam)] px-3 py-2.5 text-center text-xs font-semibold text-[var(--deep)]"
              >
                Mi cuenta
              </Link>
            ) : (
              <Link
                href="/suscripcion"
                className="flex justify-center rounded-xl bg-[var(--foam)] p-2 text-[var(--deep)]"
                title="Cuenta"
              >
                <NavIcon href="/suscripcion" />
              </Link>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          onClick={() => setCollapsed((v) => !v)}
          className="absolute top-20 -right-3 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--deep)] shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
          </svg>
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <div>
                <p className="font-display text-base font-bold text-[var(--deep)]">Control Sanitario</p>
                <p className="text-xs text-[var(--muted)]">Antioquia</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-[var(--muted)]"
              >
                Cerrar
              </button>
            </div>
            <SidebarNav active={active} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="app-main flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-md safe-top">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--deep)] lg:hidden"
                aria-label="Abrir menú"
                onClick={() => setMobileOpen(true)}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs text-[var(--muted)]">
                  Aplicaciones <span className="mx-1">›</span> {crumb}
                </p>
                <h1 className="truncate font-display text-lg font-bold text-[var(--deep)] sm:text-xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/registro"
                className="hidden rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white sm:inline-flex"
              >
                Nuevo registro
              </Link>
              <Link
                href="/suscripcion"
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--deep)]"
              >
                Salir
              </Link>
            </div>
          </div>
          {subtitle ? (
            <div className="border-t border-[var(--border)] bg-[var(--canvas)] px-4 py-2 sm:px-6 lg:px-8">
              <p className="text-sm text-[var(--muted)]">{subtitle}</p>
            </div>
          ) : null}
        </header>

        <main className={`mx-auto w-full flex-1 ${contentWidth} px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8`}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-white/95 backdrop-blur-md safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {MOBILE_NAV.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
                }`}
              >
                <NavIcon href={link.href} className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--canvas)]">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(26,143,143,0.16),_transparent_55%),linear-gradient(180deg,#0b3d5c_0%,#0b3d5c_26%,transparent_26%)]" />
        <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10 sm:max-w-xl sm:px-6">
          <div className="mb-6 text-center text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--foam)]/80">
              Control Sanitario · Antioquia
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-[var(--foam)]/85">{subtitle}</p> : null}
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-xl shadow-[var(--deep)]/10 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
