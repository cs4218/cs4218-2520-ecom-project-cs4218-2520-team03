// Seah Yi Xun Ryo, A0252602R
// Integration tests for Story A: CartPage + CartProvider working together with real localStorage.
// CartProvider and useCart are NOT mocked — only external boundaries (axios, auth, Layout, braintree) are.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../context/cart";
import CartPage from "./CartPage";

jest.mock("axios");

// Seah Yi Xun Ryo, A0252602R
const mockSetAuth = jest.fn();
const mockUseAuth = jest.fn(() => [{ user: null, token: "" }, mockSetAuth]);
jest.mock("../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

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
  return function MockDropIn() {
    return React.createElement("div", { "data-testid": "braintree-dropin" }, "DropIn");
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}));

// Seah Yi Xun Ryo, A0252602R
function renderWithRealCart() {
  return render(
    <CartProvider>
      <CartPage />
    </CartProvider>
  );
}

// Seah Yi Xun Ryo, A0252602R
describe("Story A Integration — CartPage + CartProvider", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.get.mockResolvedValue({ data: { clientToken: null } });
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Cart renders from real CartProvider state", () => {
    it("should show empty cart message when localStorage has no cart", () => {
      renderWithRealCart();
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    // Seah Yi Xun Ryo, A0252602R
    it("should display cart item hydrated from localStorage", async () => {
      const item = { _id: "p1", name: "Test Product", description: "A test item", price: 50 };
      localStorage.setItem("cart", JSON.stringify([item]));

      renderWithRealCart();

      await waitFor(() => {
        expect(screen.getByText("Test Product")).toBeInTheDocument();
      });
      expect(screen.getByText(/a test item/i)).toBeInTheDocument();
      expect(screen.getByText(/price : 50/i)).toBeInTheDocument();
      expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();
    });
  });

  describe("Remove item flow", () => {
    // Seah Yi Xun Ryo, A0252602R
    it("should show empty cart after removing the only item", async () => {
      const item = { _id: "p1", name: "Remove Me", description: "Will be removed", price: 30 };
      localStorage.setItem("cart", JSON.stringify([item]));

      renderWithRealCart();
      await waitFor(() => expect(screen.getByText("Remove Me")).toBeInTheDocument());

      await userEvent.click(screen.getByRole("button", { name: /remove/i }));

      await waitFor(() => {
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      });
      expect(screen.queryByText("Remove Me")).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("cart"))).toEqual([]);
    });

    // Seah Yi Xun Ryo, A0252602R
    it("should keep remaining item and update localStorage after removing one of two", async () => {
      const item1 = { _id: "p1", name: "Keep Me", description: "Stays in cart", price: 40 };
      const item2 = { _id: "p2", name: "Remove Me", description: "Gets removed", price: 20 };
      localStorage.setItem("cart", JSON.stringify([item1, item2]));

      renderWithRealCart();
      await waitFor(() => {
        expect(screen.getByText("Keep Me")).toBeInTheDocument();
        expect(screen.getByText("Remove Me")).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await userEvent.click(removeButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText("Remove Me")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Keep Me")).toBeInTheDocument();
      expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();

      const storedCart = JSON.parse(localStorage.getItem("cart"));
      expect(storedCart).toHaveLength(1);
      expect(storedCart[0]._id).toBe("p1");
    });

    // Seah Yi Xun Ryo, A0252602R
    it("full flow: view item in cart, remove it, cart is empty", async () => {
      const item = { _id: "p1", name: "Story A Product", description: "Full flow test item", price: 99 };
      localStorage.setItem("cart", JSON.stringify([item]));

      renderWithRealCart();

      await waitFor(() => expect(screen.getByText("Story A Product")).toBeInTheDocument());
      expect(screen.queryByText(/your cart is empty/i)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /remove/i }));

      await waitFor(() => {
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      });
      expect(screen.queryByText("Story A Product")).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("cart"))).toEqual([]);
    });
  });
});
