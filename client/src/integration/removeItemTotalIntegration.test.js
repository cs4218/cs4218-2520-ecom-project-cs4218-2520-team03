// Seah Yi Xun Ryo, A0252602R
// Integration tests for Story E: removing an item from the cart updates the displayed total.

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import { CartProvider } from "../context/cart";
import CartPage from "../pages/CartPage";

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
// Extract the USD amount from a string that may contain other text (e.g. "Total : $80.00 ").
const parseUsd = (str) => {
  const match = String(str).match(/\$([\d,]+\.\d{2})/);
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0;
};

function renderWithRealCart() {
  return render(
    <CartProvider>
      <CartPage />
    </CartProvider>
  );
}

function getTotalHeading() {
  return screen.getByRole("heading", { name: /total :/i });
}

// Seah Yi Xun Ryo, A0252602R
describe("Story E Integration — remove item updates displayed total", () => {
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

  // Seah Yi Xun Ryo, A0252602R
  it("displays the initial combined total for two items", async () => {
    const item1 = { _id: "p1", name: "Alpha", description: "First", price: 50 };
    const item2 = { _id: "p2", name: "Beta", description: "Second", price: 30 };
    localStorage.setItem("cart", JSON.stringify([item1, item2]));

    renderWithRealCart();

    await waitFor(() => {
      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
    });

    const total = parseUsd(getTotalHeading().textContent);
    expect(total).toBe(80);
  });

  // Seah Yi Xun Ryo, A0252602R
  it("total decreases after removing one of two items", async () => {
    const item1 = { _id: "p1", name: "Alpha", description: "First", price: 50 };
    const item2 = { _id: "p2", name: "Beta", description: "Second", price: 30 };
    localStorage.setItem("cart", JSON.stringify([item1, item2]));

    renderWithRealCart();

    await waitFor(() => {
      expect(parseUsd(getTotalHeading().textContent)).toBe(80);
    });

    // Remove first item (Alpha, $50)
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(parseUsd(getTotalHeading().textContent)).toBe(30);
    });
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  // Seah Yi Xun Ryo, A0252602R
  it("total reflects correct sum after removing the middle item from a three-item cart", async () => {
    const item1 = { _id: "p1", name: "Item One", description: "Desc one", price: 100 };
    const item2 = { _id: "p2", name: "Item Two", description: "Desc two", price: 50 };
    const item3 = { _id: "p3", name: "Item Three", description: "Desc three", price: 25 };
    localStorage.setItem("cart", JSON.stringify([item1, item2, item3]));

    renderWithRealCart();

    // Initial total: $175
    await waitFor(() => {
      expect(parseUsd(getTotalHeading().textContent)).toBe(175);
    });

    // Remove Item Two ($50)
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);

    // Remaining: Item One ($100) + Item Three ($25) = $125
    await waitFor(() => {
      expect(parseUsd(getTotalHeading().textContent)).toBe(125);
    });
    expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Item Three")).toBeInTheDocument();
  });

  // Seah Yi Xun Ryo, A0252602R
  it("cart summary shows empty cart message and no total row after removing the last item", async () => {
    const item = { _id: "p1", name: "Solo Item", description: "Only item", price: 45 };
    localStorage.setItem("cart", JSON.stringify([item]));

    renderWithRealCart();

    await waitFor(() => {
      expect(parseUsd(getTotalHeading().textContent)).toBe(45);
    });

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Solo Item")).not.toBeInTheDocument();
    // Cart summary heading and total row are still rendered even with empty cart
    expect(screen.getByText(/cart summary/i)).toBeInTheDocument();
    expect(parseUsd(getTotalHeading().textContent)).toBe(0);
  });

  // Seah Yi Xun Ryo, A0252602R
  it("localStorage reflects updated cart after item is removed", async () => {
    const item1 = { _id: "p1", name: "Keep Me", description: "Stays", price: 40 };
    const item2 = { _id: "p2", name: "Remove Me", description: "Goes", price: 20 };
    localStorage.setItem("cart", JSON.stringify([item1, item2]));

    renderWithRealCart();
    await waitFor(() => expect(screen.getByText("Remove Me")).toBeInTheDocument());

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);

    await waitFor(() => {
      expect(screen.queryByText("Remove Me")).not.toBeInTheDocument();
    });

    const stored = JSON.parse(localStorage.getItem("cart"));
    expect(stored).toHaveLength(1);
    expect(stored[0]._id).toBe("p1");
    // Total should now reflect only the remaining item
    expect(parseUsd(getTotalHeading().textContent)).toBe(40);
  });
});
