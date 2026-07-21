export type NavLink = {
  href: string;
  label: string;
};

export type NavGroup = {
  title: string;
  items: NavLink[];
};

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Inicio" },
      { href: "/dashboard", label: "Panel" },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/registro", label: "Registro diario" },
      { href: "/historial", label: "Historial" },
      { href: "/visitas", label: "Visitas" },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/configuracion", label: "Configuración" },
      { href: "/planes", label: "Planes" },
      { href: "/suscripcion", label: "Cuenta" },
    ],
  },
];

export const APP_NAV: NavLink[] = APP_NAV_GROUPS.flatMap((g) => g.items);

/** Links shown in the mobile bottom bar. */
export const MOBILE_NAV: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Panel" },
  { href: "/registro", label: "Registro" },
  { href: "/historial", label: "Historial" },
  { href: "/suscripcion", label: "Cuenta" },
];
