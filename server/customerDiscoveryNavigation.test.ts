import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CUSTOMER_DISCOVERY_LINKS, DISCOVERY_PAGES, isDiscoveryKey } from "../client/src/lib/customerDiscovery";

const projectRoot = new URL("..", import.meta.url);
const readClientFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("customer discovery navigation", () => {
  it("publishes a truthful customer route for every requested discovery destination", () => {
    expect(CUSTOMER_DISCOVERY_LINKS.map((link) => link.key)).toEqual(["offers", "new-arrivals", "best-sellers", "account", "contact"]);
    for (const link of CUSTOMER_DISCOVERY_LINKS) {
      expect(link.href).toBe(`/discover/${link.key}`);
      expect(DISCOVERY_PAGES[link.key].description.length).toBeGreaterThan(40);
      expect(isDiscoveryKey(link.key)).toBe(true);
    }
    expect(isDiscoveryKey("not-a-customer-path")).toBe(false);
  });

  it("keeps private administration out of all public customer navigation while preserving live store paths", () => {
    const header = readClientFile("client/src/components/FashionHeader.tsx");
    const routes = readClientFile("client/src/App.tsx");
    expect(header).not.toContain('href="/admin"');
    for (const path of ["/", "/collection", "/track", "/cart", "/discover", "/discover/:focus"]) expect(routes).toContain(path);
    for (const label of ["Home", "Shop", "Categories", "Discover", "Track order", "Bag", "Reserve a piece"]) expect(header).toContain(label);
    expect(header).toContain("CUSTOMER_DISCOVERY_LINKS.map");
    expect(header).toContain("Customer discovery");
    expect(header).toContain('aria-label="Main navigation"');
    expect(header).toContain('aria-label="Mobile navigation"');
    expect(header).toContain("lg:flex");
    expect(header).toContain("lg:hidden");
  });

  it("uses one route-aware discovery component for every holding or live customer destination", () => {
    const discoveryPage = readClientFile("client/src/pages/CustomerDiscovery.tsx");
    expect(discoveryPage).toContain('useRoute("/discover/:focus")');
    expect(discoveryPage).toContain("isDiscoveryKey(params?.focus)");
    expect(discoveryPage).toContain("DISCOVERY_PAGES[focus]");
    expect(discoveryPage).toContain("aria-label=\"Customer discovery\"");
  });
});
