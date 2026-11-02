// Only add images after confirming the exact product, manufacturer, strength and form.
// Files should be licensed for your use and placed in public/medicine-products/.
// Key is medicine ID; entries without a verified match use a neutral fallback.
export const verifiedImages: Record<number, { src: string; manufacturer: string; source: string }> = {};
