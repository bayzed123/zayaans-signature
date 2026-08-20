import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LOADING_COPY } from "../client/src/components/BrandedLoading";

const projectRoot = new URL("..", import.meta.url);
const readClientFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

function luminance(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("branded loading experience", () => {
  it("keeps a distinct, accessible loading label for catalogue, checkout, admin, and courier operations", () => {
    expect(LOADING_COPY.catalogue).toContain("collection");
    expect(LOADING_COPY.checkout).toContain("order");
    expect(LOADING_COPY.admin).toContain("atelier");
    expect(LOADING_COPY.courierCreate).toContain("consignment");
    expect(LOADING_COPY.courierStatus).toContain("courier");
  });

  it("uses the shared loader at each real request boundary instead of recreating unrelated spinners", () => {
    const surfaces = [
      ["client/src/components/CollectionMenu.tsx", "LOADING_COPY.catalogue"],
      ["client/src/components/FeaturedCollection.tsx", "LOADING_COPY.featured"],
      ["client/src/pages/Catalogue.tsx", "LOADING_COPY.catalogue"],
      ["client/src/pages/Cart.tsx", "LOADING_COPY.checkout"],
      ["client/src/pages/Admin.tsx", "LOADING_COPY.admin"],
      ["client/src/pages/Admin.tsx", "LOADING_COPY.signIn"],
      ["client/src/pages/Admin.tsx", "LOADING_COPY.courierCreate"],
      ["client/src/pages/Admin.tsx", "LOADING_COPY.courierStatus"],
    ];
    for (const [path, copy] of surfaces) {
      const source = readClientFile(path);
      expect(source).toContain("BrandedLoading");
      expect(source).toContain(copy);
    }
    const styles = readClientFile("client/src/index.css");
    expect(styles).toContain("brand-loader__ring");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("reserves stable loading space for panels and keeps action loaders inline", () => {
    const component = readClientFile("client/src/components/BrandedLoading.tsx");
    expect(component).toContain('size === "inline"');
    expect(component).toContain("min-h-11 px-3 py-2");
    expect(component).toContain("min-h-[240px] px-6 py-8");
  });

  it("defines explicit readable light and dark tones with live status semantics", () => {
    const component = readClientFile("client/src/components/BrandedLoading.tsx");
    expect(component).toContain('border-[#f6f1e9]/25 bg-[#1b1916] text-[#f6f1e9]');
    expect(component).toContain('border-[#9a8975] bg-[#ede8df] text-[#3c342b]');
    expect(component).toContain('text-[#f6f1e9]');
    expect(component).toContain('text-[#3c342b]');
    expect(component).toContain('role="status" aria-live="polite"');
    expect(contrastRatio("#3c342b", "#ede8df")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#f6f1e9", "#1b1916")).toBeGreaterThanOrEqual(4.5);
  });
});
