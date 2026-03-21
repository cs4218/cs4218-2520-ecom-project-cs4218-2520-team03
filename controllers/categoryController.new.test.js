// New tests for extended categoryController behaviours
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  singleCategoryController,
  deleteCategoryController,
} from "./categoryController.js";

jest.mock("slugify");
jest.mock("../models/categoryModel.js");

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── createCategoryController ──────────────────────────────────────────────────

describe("createCategoryController - success message", () => {
  test("success response contains exact message string", async () => {
    const req = { body: { name: "Tools" } };
    const res = makeRes();

    categoryModel.findOne.mockResolvedValue(null);
    slugify.mockReturnValue("tools");
    const savedCategory = { _id: "c1", name: "Tools", slug: "tools" };
    const save = jest.fn().mockResolvedValue(savedCategory);
    categoryModel.mockImplementation((doc) => ({ ...doc, save }));

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    // Brittle: exact message string — will break if wording changes
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "New category created successfully",
      category: savedCategory,
    });
    // Over-specific: asserts exact slugify options — couples test to implementation
    expect(slugify).toHaveBeenCalledWith("Tools", { lower: true, strict: true });
  });
});

// ── updateCategoryController ──────────────────────────────────────────────────

describe("updateCategoryController - 404 when category not found", () => {
  test("sends 404", async () => {
    const req = { body: { name: "Ghost" }, params: { id: "nonexistent" } };
    const res = makeRes();

    slugify.mockReturnValue("ghost");
    categoryModel.findByIdAndUpdate.mockResolvedValue(null);

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    // Brittle: exact object match — any extra field in res.send breaks this
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
  });

  test("returns 200 with updated category", async () => {
    const req = { body: { name: "Furniture" }, params: { id: "id99" } };
    const res = makeRes();

    slugify.mockReturnValue("furniture");
    const updated = { _id: "id99", name: "Furniture", slug: "furniture" };
    categoryModel.findByIdAndUpdate.mockResolvedValue(updated);

    await updateCategoryController(req, res);

    // Over-specific: asserts full call shape including { lower, strict } options
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "id99",
      { name: "Furniture", slug: "furniture" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    // Brittle: exact string match on message
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category updated successfully",
      category: updated,
    });
  });
});

// ── singleCategoryController ──────────────────────────────────────────────────

describe("singleCategoryController - not found", () => {
  // Missing AAA separation — Arrange, Act, and Assert are blended together
  test("returns 404 when slug does not match any category", async () => {
    const res = makeRes();
    categoryModel.findOne.mockResolvedValue(null);
    await singleCategoryController({ params: { slug: "no-such-slug" } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    // Brittle: exact message
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
    // No edge case: what if slug is an empty string? Not tested.
  });

  test("returns 200 when slug matches", async () => {
    const req = { params: { slug: "books" } };
    const res = makeRes();
    const cat = { _id: "c5", slug: "books", name: "Books" };
    categoryModel.findOne.mockResolvedValue(cat);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Brittle: asserts exact message casing — "Get single category successfully"
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get single category successfully",
      category: cat,
    });
  });
});

// ── deleteCategoryController ──────────────────────────────────────────────────

describe("deleteCategoryController - not found", () => {
  test("returns 404 when no document is deleted", async () => {
    const req = { params: { id: "ghost-id" } };
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockResolvedValue(null);

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    // Brittle: exact match
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Category not found",
    });
  });

  test("returns 200 on successful deletion", async () => {
    const req = { params: { id: "id1" } };
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockResolvedValue({ _id: "id1" });

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // Brittle: exact message string
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category deleted successfully",
    });
    // Missing: no test for what happens when id is an empty string or undefined
  });
});
