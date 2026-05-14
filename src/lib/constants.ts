export const PLAN_LIMITS = {
  free: {
    maxProductos: 10,
    maxCatalogos: 1,
    fiado: false,
    reportesEmail: false,
  },
  pro: {
    maxProductos: Infinity,
    maxCatalogos: Infinity,
    fiado: true,
    reportesEmail: true,
  },
} as const;

export const PRODUCTOS_PER_PAGE = 12;

export const PRO_PLAN_PRICE = 299;
export const PRO_PLAN_CURRENCY = "MXN";

export const COLORS = {
  primary: "#1B4D3E",
  primaryLight: "#2D6A4F",
  background: "#FFFFFF",
  surface: "#F9FAFB",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
