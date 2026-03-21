// Chen Peiran, A0257826R
import React from "react";
import { render, fireEvent, waitFor, getByTestId } from "@testing-library/react";
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

const bookDetails = {
    _id: "p1",
    name: "Book A",
    slug: "book-a",
    description: "full book description",
    price: 30,
    category: { _id: "c1", name: "Books" },
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

describe("Frontend Header Integration Tests", () => {
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

    describe("Search Function", () => {
        it("navigates to the search results page after finding products", async () => {
            axios.get
                .mockResolvedValueOnce({ data: [book] })
                .mockResolvedValueOnce({ data: { category: categories } });

            const { getByText, getByPlaceholderText, getByRole } = renderApp();

            await waitFor(() => {
                expect(getByText("All Products")).toBeInTheDocument();
            });

            fireEvent.change(getByPlaceholderText("Search"), {
                target: { value: "Book" },
            });

            fireEvent.click(getByRole("button", { name: "Search" }));

            await waitFor(() => {
                expect(getByText("Search Results")).toBeInTheDocument();
                expect(getByText("Found 1")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });
        });

        it("navigates to the search results page when no products are found", async () => {
            axios.get
                .mockResolvedValueOnce({ data: [] })
                .mockResolvedValueOnce({ data: { category: categories } });

            const { getByText, getByPlaceholderText, getByRole } = renderApp();

            await waitFor(() => {
                expect(getByText("All Products")).toBeInTheDocument();
            });

            fireEvent.change(getByPlaceholderText("Search"), {
                target: { value: "Nonexistent" },
            });

            fireEvent.click(getByRole("button", { name: "Search" }));

            await waitFor(() => {
                expect(getByText("Search Results")).toBeInTheDocument();
            });

            expect(getByText("No Products Found")).toBeInTheDocument();
        });

        it("navigates from search results to the correct product details page", async () => {
            axios.get
                .mockResolvedValueOnce({ data: [book] })
                .mockResolvedValueOnce({ data: { category: categories } })

                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({ data: { product: bookDetails } })
                .mockResolvedValueOnce({ data: { products: [] } });

            const { getByText, getByPlaceholderText, getByRole } = renderApp();

            await waitFor(() => {
                expect(getByText("All Products")).toBeInTheDocument();
            });

            fireEvent.change(getByPlaceholderText("Search"), {
                target: { value: "Book" },
            });

            fireEvent.click(getByRole("button", { name: "Search" }));

            await waitFor(() => {
                expect(getByText("Search Results")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });

            fireEvent.click(getByText("More Details"));

            await waitFor(() => {
                expect(getByText("Product Details")).toBeInTheDocument();
                expect(getByText(/Name : Book A/i)).toBeInTheDocument();
            });
        });

        it("updates the cart badge when adding a product from search results", async () => {
            axios.get
                .mockResolvedValueOnce({ data: [book] })
                .mockResolvedValueOnce({ data: { category: categories } });

            const { getByText, getByPlaceholderText, getByRole } = renderApp();

            await waitFor(() => {
                expect(getByText("0")).toBeInTheDocument();
            });

            fireEvent.change(getByPlaceholderText("Search"), {
                target: { value: "Book" },
            });

            fireEvent.click(getByRole("button", { name: "Search" }));

            await waitFor(() => {
                expect(getByText("Search Results")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });

            fireEvent.click(getByText("ADD TO CART"));

            await waitFor(() => {
                expect(getByText("1")).toBeInTheDocument();
            });

            expect(localStorage.getItem("cart")).toContain("Book A");
        });
    });

    describe("Category Function", () => {
        it("navigates from header to the All Categories page", async () => {
            axios.get
                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({ data: { category: categories } });

            const { getByText, getByRole, getByTestId } = renderApp();

            await waitFor(() => {
                expect(getByText("All Categories")).toBeInTheDocument();
            });

            fireEvent.click(getByRole("link", { name: "All Categories" }));

            await waitFor(() => {
                expect(getByTestId("categories-page-link-books")).toBeInTheDocument();
                expect(getByTestId("categories-page-link-electronics")).toBeInTheDocument();
            });
        });

        it("navigates from category dropdown to the correct category product page", async () => {
            axios.get
                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({
                    data: {
                        category: { _id: "c1", name: "Books", slug: "books" },
                        products: [book],
                    },
                });

            const { getByText, getByTestId } = renderApp();

            await waitFor(() => {
                expect(getByTestId("header-category-link-books")).toBeInTheDocument();
            });

            fireEvent.click(getByTestId("header-category-link-books"));

            await waitFor(() => {
                expect(getByText("Category - Books")).toBeInTheDocument();
                expect(getByText("1 result found")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });
        });

        it("navigates from category dropdown to a different category product page", async () => {
            axios.get
                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({
                    data: {
                        category: { _id: "c2", name: "Electronics", slug: "electronics" },
                        products: [laptop],
                    },
                });

            const { getByText, getByTestId } = renderApp();

            await waitFor(() => {
                expect(getByTestId("header-category-link-electronics")).toBeInTheDocument();
            });

            fireEvent.click(getByTestId("header-category-link-electronics"));

            await waitFor(() => {
                expect(getByText("Category - Electronics")).toBeInTheDocument();
                expect(getByText("1 result found")).toBeInTheDocument();
                expect(getByText("Laptop")).toBeInTheDocument();
            });
        });

        it("navigates from category product page to the correct product details page", async () => {
            axios.get
                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({
                    data: {
                        category: { _id: "c1", name: "Books", slug: "books" },
                        products: [book],
                    },
                })

                .mockResolvedValueOnce({ data: { category: categories } })
                .mockResolvedValueOnce({ data: { product: bookDetails } })
                .mockResolvedValueOnce({ data: { products: [] } });

            const { getByText, getByTestId } = renderApp();

            await waitFor(() => {
                expect(getByTestId("header-category-link-books")).toBeInTheDocument();
            });

            fireEvent.click(getByTestId("header-category-link-books"));

            await waitFor(() => {
                expect(getByText("Category - Books")).toBeInTheDocument();
                expect(getByText("Book A")).toBeInTheDocument();
            });

            fireEvent.click(getByText("More Details"));

            await waitFor(() => {
                expect(getByText("Product Details")).toBeInTheDocument();
                expect(getByText("Name : Book A")).toBeInTheDocument();
            });
        });
    });
});