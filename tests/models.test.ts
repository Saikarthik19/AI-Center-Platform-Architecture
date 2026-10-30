import { describe, it, expect } from "vitest";
import { getCatalogModels, getModelByIdOrSlug } from "../src/lib/db";
import { SEED_MODELS } from "../src/lib/db/seed-data";

describe("Model Catalog & Filtering", () => {
  it("should return catalog models with rich metadata", async () => {
    const models = await getCatalogModels();
    expect(models.length).toBeGreaterThanOrEqual(15);
    const flash = models.find((m) => m.slug === "gemini-1.5-flash");
    expect(flash).toBeDefined();
    expect(flash.contextWindow).toBe(1048576);
  });

  it("should filter models by category", async () => {
    const codingModels = await getCatalogModels({ category: "CODING" });
    expect(codingModels.length).toBeGreaterThan(0);
    expect(codingModels.every((m) => m.category === "CODING")).toBe(true);
  });

  it("should filter models by free tier status", async () => {
    const freeModels = await getCatalogModels({ freeTierStatus: "RECURRING_FREE" });
    expect(freeModels.length).toBeGreaterThan(0);
    expect(freeModels.every((m) => m.freeTierStatus === "RECURRING_FREE")).toBe(true);
  });

  it("should retrieve a model by exact slug identifier", async () => {
    const model = await getModelByIdOrSlug("llama-3.3-70b-versatile");
    expect(model).toBeDefined();
    expect(model?.name).toBe("Llama 3.3 70B Versatile");
  });
});
