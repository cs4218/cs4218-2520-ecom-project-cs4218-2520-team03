// Seah Yi Xun Ryo, A0252602R
// Integration tests for Story C, empty cart shows correct UI and hides checkout section.
// CartProvider and useCart are real, only external boundaries (axios, auth, Layout, braintree) are mocked.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../context/cart";
import CartPage from "./CartPage";

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
function renderWithRealCart() {
  return render(
    <CartProvider>
      <CartPage />
    </CartProvider>
  );
}

// Seah Yi Xun Ryo, A0252602R
describe("Story C Integration — Empty cart: no checkout UI when cart has no items", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Empty cart message", () => {
    it("shows 'Your Cart Is Empty' when no items in localStorage", () => {
      mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: null } });

      renderWithRealCart();

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    // Seah Yi Xun Ryo, A0252602R
    it("shows 'Your Cart Is Empty' for a logged-in user with an empty cart", () => {
      mockAuthValue = [{ user: { name: "Test", address: "123 St" }, token: "tok" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

      renderWithRealCart();

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
  });

  describe("Checkout section hidden when cart is empty", () => {
    // Seah Yi Xun Ryo, A0252602R
    it("does not show DropIn or Make Payment even when logged in with a valid clientToken", async () => {
      mockAuthValue = [{ user: { name: "Test", address: "123 St" }, token: "tok" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

      renderWithRealCart();

      // Give time for clientToken to resolve
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /make payment/i })).not.toBeInTheDocument();
    });

    it("does not show DropIn or Make Payment for a guest user", async () => {
      mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

      renderWithRealCart();

      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /make payment/i })).not.toBeInTheDocument();
    });
  });

  describe("Guest user prompt", () => {
    // Seah Yi Xun Ryo, A0252602R
    it("shows 'Plase Login to checkout' button for a guest user with an empty cart", () => {
      mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: null } });

      renderWithRealCart();

      expect(screen.getByRole("button", { name: /login to checkout/i })).toBeInTheDocument();
    });

    it("does not show login button for a logged-in user", () => {
      mockAuthValue = [{ user: { name: "Test" }, token: "tok" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: { clientToken: null } });

      renderWithRealCart();

      expect(screen.queryByRole("button", { name: /login to checkout/i })).not.toBeInTheDocument();
    });
  });
});
