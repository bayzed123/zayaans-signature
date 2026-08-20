import { type HTMLAttributes } from "react";

export const LOADING_COPY = {
  catalogue: "Curating the collection",
  featured: "Preparing the signature edit",
  checkout: "Sending order request",
  admin: "Refreshing atelier data",
  signIn: "Opening the atelier console",
  courierCreate: "Creating consignment",
  courierStatus: "Refreshing courier status",
} as const;

type BrandedLoadingProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  tone?: "light" | "dark";
  size?: "inline" | "compact" | "panel";
};

export function BrandedLoading({ label, tone = "light", size = "panel", className = "", ...props }: BrandedLoadingProps) {
  const dark = tone === "dark";
  const surface = dark ? "border-[#f6f1e9]/25 bg-[#1b1916] text-[#f6f1e9]" : "border-[#9a8975] bg-[#ede8df] text-[#3c342b]";
  const labelClass = dark ? "text-[#f6f1e9]" : "text-[#3c342b]";
  const ring = <span aria-hidden="true" className="brand-loader__ring h-5 w-5 shrink-0 rounded-full border-2 border-[--gold]/35 border-t-[--gold]" />;

  if (size === "inline") return <span role="status" aria-live="polite" className={`inline-flex items-center justify-center gap-2 font-ui text-[9px] font-bold uppercase tracking-[.12em] ${labelClass} ${className}`} {...props}>{ring}<span>{label}</span></span>;

  const height = size === "compact" ? "min-h-11 px-3 py-2" : "min-h-[240px] px-6 py-8";
  return <div role="status" aria-live="polite" className={`flex items-center justify-center gap-3 border ${surface} ${height} ${className}`} {...props}>{ring}<span className="font-ui text-[10px] font-bold uppercase tracking-[.18em]">{label}</span></div>;
}
