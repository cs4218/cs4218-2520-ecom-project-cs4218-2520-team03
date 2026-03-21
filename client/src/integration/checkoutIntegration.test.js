// Seah Yi Xun Ryo, A0252602R
// Integration tests for Story B: checkout flow — CartPage payment section + Orders page.
// CartProvider and useCart are real; only external boundaries (axios, braintree, auth, Layout) are mocked.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../context/cart";
import CartPage from "./CartPage";
import Orders from "./user/Orders";

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
jest.mock("../components/UserMenu", () => () => (
  <div data-testid="user-menu" />
));

// DropIn mock that calls onInstance so CartPage's instance state gets set
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
describe("Story B Integration — Checkout flow: CartPage payment + Orders", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAuthValue = [{ user: null, token: "" }, mockSetAuth];
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("CartPage payment section visibility", () => {
    it("hides payment section when there is no clientToken", async () => {
      mockAuthValue = [{ user: { name: "Test", address: "123 St" }, token: "tok" }, mockSetAuth];
      const item = { _id: "p1", name: "Item", description: "desc", price: 50 };
      localStorage.setItem("cart", JSON.stringify([item]));
      axios.get.mockResolvedValue({ data: { clientToken: null } });

      renderWithRealCart();

      await waitFor(() => expect(screen.getByText("Item")).toBeInTheDocument());
      expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /make payment/i })).not.toBeInTheDocument();
    });

    // Seah Yi Xun Ryo, A0252602R
    it("shows payment section when logged in with cart items and a valid clientToken", async () => {
      mockAuthValue = [{ user: { name: "Test", address: "123 St" }, token: "tok" }, mockSetAuth];
      const item = { _id: "p1", name: "Item", description: "desc", price: 50 };
      localStorage.setItem("cart", JSON.stringify([item]));
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

      renderWithRealCart();

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /make payment/i })).toBeInTheDocument();
    });

    it("disables Make Payment when user has no address", async () => {
      mockAuthValue = [{ user: { name: "Test" }, token: "tok" }, mockSetAuth];
      const item = { _id: "p1", name: "Item", description: "desc", price: 50 };
      localStorage.setItem("cart", JSON.stringify([item]));
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

      renderWithRealCart();

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /make payment/i })).toBeDisabled();
    });
  });

  describe("CartPage handlePayment", () => {
    // Seah Yi Xun Ryo, A0252602R
    it("posts nonce and cart to payment API, clears localStorage, and navigates to orders", async () => {
      mockAuthValue = [{ user: { name: "Test", address: "123 St" }, token: "tok" }, mockSetAuth];
      const item = { _id: "p1", name: "Paid Item", description: "desc", price: 100 };
      localStorage.setItem("cart", JSON.stringify([item]));
      axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
      axios.post.mockResolvedValue({ data: {} });

      renderWithRealCart();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /make payment/i })).not.toBeDisabled();
      });

      await userEvent.click(screen.getByRole("button", { name: /make payment/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          { nonce: "test-nonce", cart: [item] }
        );
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      });
      expect(localStorage.getItem("cart")).toBeNull();
    });
  });

  describe("Orders page renders fetched orders", () => {
    // Seah Yi Xun Ryo, A0252602R
    it("renders order rows returned by the API", async () => {
      mockAuthValue = [{ user: { name: "Buyer" }, token: "tok" }, mockSetAuth];
      const mockOrders = [
        {
          _id: "o1",
          status: "Processing",
          buyer: { name: "Buyer" },
          createAt: new Date().toISOString(),
          payment: { success: true },
          products: [{ _id: "p1", name: "Ordered Product", description: "item desc", price: 99 }],
        },
      ];
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() => {
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("Success")).toBeInTheDocument();
        expect(screen.getByText("Ordered Product")).toBeInTheDocument();
      });
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    it("renders the order table headers", () => {
      mockAuthValue = [{ user: { name: "Buyer" }, token: "tok" }, mockSetAuth];
      axios.get.mockResolvedValue({ data: [] });

      render(<Orders />);

      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
  });
});
