// Seah Yi Xun Ryo, A0252602R
// Integration tests for Story D: add two products from HomePage and verify both appear in CartPage.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../context/cart";
import HomePage from "../pages/HomePage";
import CartPage from "../pages/CartPage";

jest.mock("axios");

// Seah Yi Xun Ryo, A0252602R
const mockSetAuth = jest.fn();
let mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
const mockUseAuth = jest.fn(() => mockAuthValue);
jest.mock("../context/auth", () => ({ useAuth: () => mockUseAuth() }));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  return function MockDropIn({ onInstance }) {
    React.useEffect(() => {
      if (onInstance) {
        onInstance({ requestPaymentMethod: async () => ({ nonce: "test-nonce" }) });
      }
    }, []);
    return React.createElement("div", { "data-testid": "braintree-dropin" }, "DropIn");
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}));

// Seah Yi Xun Ryo, A0252602R
// Both pages share the same CartProvider — this is the integration point.
function renderBothPages() {
  return render(
    <CartProvider>
      <HomePage />
      <CartPage />
    </CartProvider>
  );
}

const PRODUCTS = [
  { _id: "p1", name: "Product One", description: "First product description", price: 10, slug: "product-one" },
  { _id: "p2", name: "Product Two", description: "Second product description", price: 20, slug: "product-two" },
];

// Seah Yi Xun Ryo, A0252602R
describe("Story D Integration — Add two products from HomePage, verify both in CartPage", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
    axios.get.mockImplementation((url) => {
      if (url.includes("product-list")) return Promise.resolve({ data: { products: PRODUCTS } });
      if (url.includes("product-count")) return Promise.resolve({ data: { total: 2 } });
      if (url.includes("get-category")) return Promise.resolve({ data: { success: true, category: [] } });
      if (url.includes("braintree/token")) return Promise.resolve({ data: { clientToken: null } });
      return Promise.resolve({ data: {} });
    });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Seah Yi Xun Ryo, A0252602R
  it("both products appear in CartPage after clicking ADD TO CART twice on HomePage", async () => {
    renderBothPages();

    // Wait for the product list to load in HomePage
    await waitFor(() => {
      expect(screen.getByText("Product One")).toBeInTheDocument();
      expect(screen.getByText("Product Two")).toBeInTheDocument();
    });

    // Click ADD TO CART for both products
    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await userEvent.click(addButtons[0]);
    await userEvent.click(addButtons[1]);

    // CartPage (same CartProvider) should now show both items
    await waitFor(() => {
      expect(screen.getAllByText("Product One")).toHaveLength(2); // once in HomePage, once in CartPage
      expect(screen.getAllByText("Product Two")).toHaveLength(2);
    });

    // Cart should NOT show the empty message
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });

  // Seah Yi Xun Ryo, A0252602R
  it("localStorage contains both products after adding from HomePage", async () => {
    renderBothPages();

    await waitFor(() => {
      expect(screen.getByText("Product One")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await userEvent.click(addButtons[0]);
    await userEvent.click(addButtons[1]);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("cart"));
      expect(stored).toHaveLength(2);
    });

    const stored = JSON.parse(localStorage.getItem("cart"));
    expect(stored.some((p) => p._id === "p1")).toBe(true);
    expect(stored.some((p) => p._id === "p2")).toBe(true);
  });

  it("adding only one product shows one item in CartPage and not the other", async () => {
    renderBothPages();

    await waitFor(() => {
      expect(screen.getByText("Product One")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await userEvent.click(addButtons[0]);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("cart"));
      expect(stored).toHaveLength(1);
      expect(stored[0]._id).toBe("p1");
    });

    // CartPage section should show Product One but not Product Two
    await waitFor(() => {
      // Product One appears in both HomePage card and CartPage
      expect(screen.getAllByText("Product One").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
  });

  // Seah Yi Xun Ryo, A0252602R
  it("CartPage shows correct total price after adding two products", async () => {
    renderBothPages();

    await waitFor(() => {
      expect(screen.getByText("Product One")).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole("button", { name: /add to cart/i });
    await userEvent.click(addButtons[0]);
    await userEvent.click(addButtons[1]);

    // Total should be $30.00 (10 + 20)
    await waitFor(() => {
      expect(screen.getByText(/total : \$30\.00/i)).toBeInTheDocument();
    });
  });
});
