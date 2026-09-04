import { MAX_CATALOG_PRICE } from "@/lib/product-constraints";
import type { AccountGender, Product } from "@/lib/types";

export type CatalogSort = "newest" | "low" | "high";
export type CatalogGender = "all" | Exclude<AccountGender, "unspecified">;

export type CatalogFilters = {
  category: string;
  query: string;
  sort: CatalogSort;
  gender: CatalogGender;
  characterIds: string[];
  minimumPrice: string;
  maximumPrice: string;
};

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export const defaultCatalogFilters: CatalogFilters = {
  category: "all",
  query: "",
  sort: "newest",
  gender: "all",
  characterIds: [],
  minimumPrice: "0",
  maximumPrice: String(MAX_CATALOG_PRICE),
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function priceValue(value: string | undefined, fallback: string) {
  if (value === "") return "";
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return String(Math.min(MAX_CATALOG_PRICE, Math.max(0, number)));
}

export function parseCatalogFilters(searchParams: CatalogSearchParams): CatalogFilters {
  const category = firstValue(searchParams.category);
  const query = firstValue(searchParams.query);
  const sort = firstValue(searchParams.sort);
  const gender = firstValue(searchParams.gender);
  const characters = firstValue(searchParams.characters);

  return {
    category: category || defaultCatalogFilters.category,
    query: query ?? defaultCatalogFilters.query,
    sort: sort === "low" || sort === "high" ? sort : defaultCatalogFilters.sort,
    gender: gender === "male" || gender === "female" ? gender : defaultCatalogFilters.gender,
    characterIds: [...new Set((characters ?? "").split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 100),
    minimumPrice: priceValue(firstValue(searchParams.minPrice), defaultCatalogFilters.minimumPrice),
    maximumPrice: priceValue(firstValue(searchParams.maxPrice), defaultCatalogFilters.maximumPrice),
  };
}

export function filterCatalogProducts(products: Product[], filters: CatalogFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const minimum = filters.minimumPrice === "" ? 0 : Number(filters.minimumPrice);
  const maximum = filters.maximumPrice === "" ? MAX_CATALOG_PRICE : Number(filters.maximumPrice);
  const result = products.filter((product) =>
    (filters.category === "all" || product.category === filters.category)
    && (filters.gender === "all" || product.accountGender === filters.gender)
    && filters.characterIds.every((characterId) => product.characterIds.includes(characterId))
    && product.price >= minimum
    && product.price <= maximum
    && (!normalizedQuery || `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery))
  );

  return [...result].sort((a, b) => filters.sort === "low"
    ? a.price - b.price
    : filters.sort === "high"
      ? b.price - a.price
      : b.createdAt.localeCompare(a.createdAt));
}

export function catalogFiltersToSearchParams(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.category !== defaultCatalogFilters.category) params.set("category", filters.category);
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.sort !== defaultCatalogFilters.sort) params.set("sort", filters.sort);
  if (filters.gender !== defaultCatalogFilters.gender) params.set("gender", filters.gender);
  if (filters.characterIds.length) params.set("characters", filters.characterIds.join(","));
  if (filters.minimumPrice !== defaultCatalogFilters.minimumPrice) params.set("minPrice", filters.minimumPrice);
  if (filters.maximumPrice !== defaultCatalogFilters.maximumPrice) params.set("maxPrice", filters.maximumPrice);
  return params.toString();
}

export function hasCatalogContext(searchParams: CatalogSearchParams) {
  return ["category", "query", "sort", "gender", "characters", "minPrice", "maxPrice"]
    .some((key) => firstValue(searchParams[key]) !== undefined);
}
