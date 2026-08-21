export type CategoryImageTarget = {
  slug?: string | null;
  parentLabel?: string | null;
  imageUrl?: string | null;
  name?: string | null;
};

/** Managed fallback imagery ensures new or uncustomised categories never render blank. */
const catalogueAsset = (filename: string) => `${import.meta.env.BASE_URL}images/catalogue/${filename}`;

/**
 * These three photographs are the only stock images in the repo that
 * genuinely depict what they are used for -- everything else (a Louis
 * Vuitton handbag, a man in a suit, an avant-garde couture gown, and adult
 * streetwear) was previously mislabelled and reused across unrelated
 * categories, which is why every "Women" subcategory rendered the same
 * (wrong) photo. Real per-category photography belongs in the admin
 * Category editor's image field -- until an admin sets one, categories fall
 * back to a generated, brand-styled tile instead of another mismatched stock
 * photo (see `placeholderTile` below).
 */
export const CATEGORY_IMAGE_ASSETS = {
  womensWardrobe: catalogueAsset("womens-wardrobe.jpg"),
  signatureOccasion: catalogueAsset("signature-occasion.jpg"),
  motherDaughter: catalogueAsset("mother-daughter.jpg"),
} as const;

type Palette = { bg: string; fg: string; accent: string };

/** Five on-brand palettes (charcoal, cream, burgundy, botanical, plum -- all paired with the house gold) so generated tiles never look identical. */
const PALETTES: Palette[] = [
  { bg: "#171512", fg: "#e9d9b8", accent: "#b8924c" },
  { bg: "#e8e0d3", fg: "#171512", accent: "#8f6b2c" },
  { bg: "#3b1f22", fg: "#e9d9b8", accent: "#c79a56" },
  { bg: "#22301f", fg: "#e9d9b8", accent: "#c79a56" },
  { bg: "#2a2440", fg: "#e9d9b8", accent: "#c79a56" },
];

/** Small, stable string hash (djb2) -- same category always renders the same tile. */
function hash(input: string): number {
  let h = 5381;
  for (let index = 0; index < input.length; index += 1) h = (h * 33) ^ input.charCodeAt(index);
  return Math.abs(h);
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "ZS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Generates a deterministic, brand-styled placeholder tile for a category
 * that has no real photography yet. Every distinct category name renders a
 * visually distinct tile (palette + monogram + label all vary by name), so
 * a grid of dozens of categories never looks like the same card repeated.
 */
export function placeholderTile(name: string): string {
  const seed = hash(name.toLowerCase());
  const palette = PALETTES[seed % PALETTES.length];
  const rotate = (seed % 7) - 3;
  const label = escapeXml(name.toUpperCase());
  const mark = escapeXml(initials(name));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${label}">
    <rect width="400" height="500" fill="${palette.bg}" />
    <circle cx="200" cy="205" r="230" fill="${palette.accent}" fill-opacity="0.08" />
    <g transform="rotate(${rotate} 200 205)">
      <circle cx="200" cy="205" r="88" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.55" />
      <text x="200" y="228" font-family="Georgia, 'Times New Roman', serif" font-size="74" fill="${palette.fg}" text-anchor="middle">${mark}</text>
    </g>
    <line x1="150" y1="420" x2="250" y2="420" stroke="${palette.accent}" stroke-width="1.5" />
    <text x="200" y="452" font-family="Arial, Helvetica, sans-serif" font-size="15" letter-spacing="2" font-weight="700" fill="${palette.fg}" text-anchor="middle">${label}</text>
    <text x="200" y="475" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="3" fill="${palette.accent}" text-anchor="middle">ZAYAAN'S SIGNATURE</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function categoryImage(target: CategoryImageTarget): string {
  if (target.imageUrl?.trim()) return target.imageUrl;
  const name = target.name ?? "";
  // Only match on the category's own name/slug here, never on parentLabel:
  // dozens of unrelated siblings (Bottom Wear, Beauty Accessories, Yoga
  // Collection, ...) all share the same parentLabel ("Women"), which is
  // exactly how the original bug collapsed them onto one identical photo.
  const searchable = `${target.slug ?? ""} ${name}`.toLowerCase();
  if (/nargisus|occasion|bridal|^gown$| gown/.test(searchable)) return CATEGORY_IMAGE_ASSETS.signatureOccasion;
  if (/mini-me|mother/.test(searchable)) return CATEGORY_IMAGE_ASSETS.motherDaughter;
  if (/^women$/.test(name.trim().toLowerCase()) || /^women$/.test((target.slug ?? "").trim().toLowerCase())) return CATEGORY_IMAGE_ASSETS.womensWardrobe;
  return placeholderTile(name || target.slug || target.parentLabel || "Zayaan's Signature");
}

export function categoryImageForSlug(slug: string | null | undefined): string {
  return categoryImage({ slug });
}
