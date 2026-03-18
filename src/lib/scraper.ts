import * as cheerio from "cheerio";

interface ScrapedRecipe {
  title: string;
  description: string;
  steps: string[];
  prepTime: number | null;
  cookTime: number | null;
  servings: number;
  ingredients: { name: string; quantity: number | null; unit: string | null; preparation: string | null }[];
  sourceUrl: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function parseDuration(iso: string): number | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  return (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
}

function parseIngredientString(raw: string): {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
} {
  const trimmed = raw.trim();
  const units = [
    "cups?", "tablespoons?", "tbsp", "teaspoons?", "tsp", "pounds?", "lbs?",
    "ounces?", "oz", "grams?", "g", "kilograms?", "kg", "ml", "liters?",
    "quarts?", "pints?", "gallons?", "cloves?", "slices?", "pieces?", "cans?",
    "packages?", "bunches?", "stalks?", "sprigs?", "pinch(?:es)?", "dash(?:es)?",
  ];
  const unitPattern = units.join("|");
  const re = new RegExp(
    `^([\\d¼½¾⅓⅔⅛/. -]+)?\\s*(?:(${unitPattern})\\s+(?:of\\s+)?)?(.+)`,
    "i"
  );
  const match = trimmed.match(re);
  if (!match) return { name: trimmed, quantity: null, unit: null, preparation: null };

  let quantity: number | null = null;
  if (match[1]) {
    const qStr = match[1]
      .trim()
      .replace("¼", ".25")
      .replace("½", ".5")
      .replace("¾", ".75")
      .replace("⅓", ".33")
      .replace("⅔", ".67")
      .replace("⅛", ".125");
    // Handle fractions like "1/2"
    if (qStr.includes("/")) {
      const parts = qStr.split("/");
      quantity = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else {
      // Handle "1 1/2" style
      const spaceParts = qStr.trim().split(/\s+/);
      if (spaceParts.length === 2 && spaceParts[1].includes("/")) {
        const fracParts = spaceParts[1].split("/");
        quantity =
          parseFloat(spaceParts[0]) +
          parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      } else {
        quantity = parseFloat(qStr);
      }
    }
    if (isNaN(quantity)) quantity = null;
  }

  const unit = match[2] || null;
  let nameAndPrep = (match[3] || "").trim();

  // Extract preparation from commas
  let preparation: string | null = null;
  const commaIdx = nameAndPrep.indexOf(",");
  if (commaIdx !== -1) {
    preparation = nameAndPrep.slice(commaIdx + 1).trim();
    nameAndPrep = nameAndPrep.slice(0, commaIdx).trim();
  }

  return { name: nameAndPrep.toLowerCase(), quantity, unit, preparation };
}

function parseServings(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseInt(val);
    return isNaN(n) ? 4 : n;
  }
  return 4;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RecipeCatalogue/1.0)",
    },
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  // Find JSON-LD
  let recipeData: Record<string, unknown> | null = null;

  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const items = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
      for (const item of items) {
        if (item["@type"] === "Recipe" || (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
          recipeData = item;
          return false; // break
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  if (!recipeData) return null;

  const rd = recipeData as Record<string, unknown>;

  // Parse instructions
  let steps: string[] = [];
  const instructions = rd.recipeInstructions;
  if (Array.isArray(instructions)) {
    steps = instructions.map((inst) => {
      if (typeof inst === "string") return decodeHtmlEntities(inst);
      if (inst?.text) return decodeHtmlEntities(inst.text as string);
      if (inst?.name) return decodeHtmlEntities(inst.name as string);
      return decodeHtmlEntities(String(inst));
    });
  } else if (typeof instructions === "string") {
    steps = instructions.split(/\n+/).filter(Boolean).map(decodeHtmlEntities);
  }

  // Parse ingredients
  const rawIngredients = Array.isArray(rd.recipeIngredient)
    ? (rd.recipeIngredient as string[]).map(decodeHtmlEntities)
    : [];

  return {
    title: decodeHtmlEntities((rd.name as string) || ""),
    description: decodeHtmlEntities((rd.description as string) || ""),
    steps: steps.length > 0 ? steps : [""],
    prepTime: parseDuration(rd.prepTime as string),
    cookTime: parseDuration(rd.cookTime as string),
    servings: parseServings(rd.recipeYield),
    ingredients: rawIngredients.map(parseIngredientString),
    sourceUrl: url,
  };
}
