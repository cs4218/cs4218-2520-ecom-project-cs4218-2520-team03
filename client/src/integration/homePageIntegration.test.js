// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import HomePage from "../pages/HomePage";
import Search from "../pages/Search";
import Categories from "../pages/Categories";
import CategoryProduct from "../pages/CategoryProduct";
import ProductDetails from "../pages/ProductDetails";

import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
    success: jest.fn(),
    error: jest.fn(),
    Toaster: () => <div />,
}));

jest.mock("../components/Footer", () => () => <div />);
jest.mock("react-icons/ai", () => ({
    AiOutlineReload: () => <span />,
}));

jest.mock("antd", () => {

    const Checkbox = ({ children, onChange }) => (
        <label>
            <input
                type="checkbox"
                aria-label={typeof children === "string" ? children : "checkbox"}
                onChange={(e) => onChange?.(e)}
            />
            {children}
        </label>
    );

    const Radio = ({ children, value }) => (
        <button
            type="button"
            data-radio-value={JSON.stringify(value)}
        >
            {children}
        </button>
    );

    Radio.Group = ({ children, onChange }) => (
        <div
            onClick={(e) => {
                const btn = e.target.closest("button[data-radio-value]");
                if (!btn) return;
                onChange?.({ target: { value: JSON.parse(btn.dataset.radioValue) } });
            }}
        >
            {children}
        </div>
    );

    const Badge = ({ count, children }) => (
        <div>
            <span>{count}</span>
            {children}
        </div>
    );

    return { Checkbox, Radio, Badge };
});

const categories = [
    { _id: "c1", name: "Books", slug: "books" },
    { _id: "c2", name: "Electronics", slug: "electronics" },
];

const book = {
    _id: "p1",
    name: "Book A",
    slug: "book-a",
    description: "book description long enough for testing",
    price: 30,
    quantity: 5,
    category: "c1",
};

const laptop = {
    _id: "p2",
    name: "Laptop",
    slug: "laptop",
    description: "laptop description long enough for testing",
    price: 120,
    quantity: 5,
    category: "c2",
};

const allProducts = [book, laptop];

const renderApp = (route = "/") =>
    render(
        <AuthProvider>
            <SearchProvider>
                <CartProvider>
                    <MemoryRouter initialEntries={[route]}>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/categories" element={<Categories />} />
                            <Route path="/category/:slug" element={<CategoryProduct />} />
                            <Route path="/product/:slug" element={<ProductDetails />} />
                        </Routes>
                    </MemoryRouter>
                </CartProvider>
            </SearchProvider>
        </AuthProvider>
    );

describe("Frontend HomePage Integration Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        localStorage.setItem(
            "auth",
            JSON.stringify({
                user: { name: "User", role: 0 },
                token: "token",
            })
        );

        axios.get
            .mockResolvedValueOnce({ data: { category: categories } })
            .mockResolvedValueOnce({ data: { success: true, category: categories } })
            .mockResolvedValueOnce({ data: { total: 2 } })
            .mockResolvedValueOnce({ data: { products: allProducts } });
    });

    describe("Filter Function", () => {
        it("updates cart badge when the filtered product is added", async () => {
            axios.post.mockResolvedValueOnce({ data: { products: [book] } });

            const { getByText, getByLabelText, queryByText } = renderApp();

            await waitFor(() => {
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
                expect(getByText("0")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
            });

            fireEvent.click(getByText("ADD TO CART"));

            await waitFor(() => {
                expect(getByText("1")).toBeInTheDocument();
            });

            expect(localStorage.getItem("cart")).toContain("Book A");
        });

        it("applies a price-only filter on the homepage correctly", async () => {
            axios.post.mockResolvedValueOnce({ data: { products: [book] } });

            const { getByText, queryByText } = renderApp();

            await waitFor(() => {
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });

            fireEvent.click(getByText("$20 to 39"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
            });

            expect(getByText("Book A")).toBeInTheDocument();
        });

        it("restores the full product list when a category filter is removed", async () => {
            axios.post.mockResolvedValueOnce({ data: { products: [book] } });
            axios.get.mockResolvedValueOnce({ data: { products: allProducts } });

            const { getByText, getByLabelText, queryByText } = renderApp();

            await waitFor(() => {
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
                expect(getByText("Book A")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));

            await waitFor(() => {
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });
        });

        it("applies filters before navigating to the correct product details page", async () => {
            const bookDetails = {
                _id: "p1",
                name: "Book A",
                slug: "book-a",
                description: "full book description",
                price: 30,
                category: { _id: "c1", name: "Books" },
            };

            axios.get
                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({ data: { product: bookDetails } })
                .mockResolvedValueOnce({ data: { products: [] } });

            axios.post
                .mockResolvedValueOnce({ data: { products: [book] } })
                .mockResolvedValueOnce({ data: { products: [book] } });

            const { getByText, getByLabelText, queryByText } = renderApp();

            await waitFor(() => {
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));
            fireEvent.click(getByText("$20 to 39"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
            });

            fireEvent.click(getByText("More Details"));

            await waitFor(() => {
                expect(getByText("Product Details")).toBeInTheDocument();
                expect(getByText("Name : Book A")).toBeInTheDocument();
            });
        });

        it("restores the cart badge after adding a filtered product and remounting", async () => {
            axios.post.mockResolvedValueOnce({ data: { products: [book] } });

            const firstRender = renderApp();
            const { getByText, getByLabelText, queryByText, unmount } = firstRender;

            await waitFor(() => {
                expect(getByText("0")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
            });

            fireEvent.click(getByText("ADD TO CART"));

            await waitFor(() => {
                expect(getByText("1")).toBeInTheDocument();
            });

            unmount();

            axios.get
                .mockResolvedValueOnce({ data: { success: true, category: categories } })
                .mockResolvedValueOnce({ data: { total: 2 } })
                .mockResolvedValueOnce({ data: { products: allProducts } });

            const secondRender = renderApp();
            const { getByText: getByTextAgain } = secondRender;

            await waitFor(() => {
                expect(getByTextAgain("1")).toBeInTheDocument();
                expect(getByTextAgain("Cart")).toBeInTheDocument();
            });
        });

        it("accumulates cart state across two different filters", async () => {
            axios.post
                .mockResolvedValueOnce({ data: { products: [book] } })
                .mockResolvedValueOnce({ data: { products: [laptop] } });

            const { getByText, getByLabelText, queryByText } = renderApp();

            await waitFor(() => {
                expect(getByText("0")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));

            await waitFor(() => {
                expect(queryByText("Laptop")).toBeNull();
            });

            fireEvent.click(getByText("ADD TO CART"));

            await waitFor(() => {
                expect(getByText("1")).toBeInTheDocument();
            });

            fireEvent.click(getByLabelText("Books"));
            fireEvent.click(getByLabelText("Electronics"));

            await waitFor(() => {
                expect(queryByText("Book A")).toBeNull();
            });

            fireEvent.click(getByText("ADD TO CART"));

            await waitFor(() => {
                expect(getByText("2")).toBeInTheDocument();
            });

            expect(localStorage.getItem("cart")).toContain("Laptop");
        });
    });
});