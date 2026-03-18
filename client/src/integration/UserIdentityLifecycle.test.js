// Sun Zihan, A0259581R
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";
import Login from "../pages/Auth/Login";
import { registerController, loginController } from "../../../controllers/authController";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import axios from "axios";
import "@testing-library/jest-dom";

jest.mock("axios");
jest.mock("../hooks/useCategory", () => jest.fn(() => []));

describe("Integration: User Identity Lifecycle", () => {
  let mongoServer;

  beforeAll(async () => {
    jest.spyOn(console, "warn").mockImplementation((msg) => {
      if (msg.includes("React Router Future Flag Warning")) return;
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = "test-secret-key";
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.warn.mockRestore();
  });

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const testUser = {
    name: "Lifecycle User",
    email: "lifecycle@test.com",
    password: "password123",
    phone: "99998888",
    address: "123 Test Road",
    answer: "Blue",
  };

  it("should complete the full identity cycle from registration to login to reactive UI update and logout", async () => {
    const registerReq = { body: testUser };
    const registerRes = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await registerController(registerReq, registerRes);

    axios.post.mockImplementation(async (url, data) => {
      if (url === "/api/v1/auth/login") {
        const loginReq = { body: data };
        const loginRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn((payload) => { loginRes.data = payload; }),
        };
        await loginController(loginReq, loginRes);
        return loginRes;
      }
    });

    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/login"]}>
              <Login />
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: testUser.email } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: testUser.password } });
    fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

    await waitFor(() => {
      const storedData = JSON.parse(localStorage.getItem("auth"));
      expect(storedData.user.email).toBe(testUser.email);
    });

    const userNameElement = await screen.findByText(testUser.name, { selector: "a" });
    expect(userNameElement).toBeInTheDocument();

    fireEvent.click(userNameElement);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(localStorage.getItem("auth")).toBeNull();
  });

  it("should handle loginController errors gracefully in the UI", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    axios.post.mockRejectedValue({
      response: { data: { success: false, message: "Invalid email or password" } }
    });

    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/login"]}>
              <Login />
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "wrong@test.com" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("should restore AuthContext state from localStorage on application remount", async () => {
    const mockAuthData = {
      user: { name: "Persisted User", email: "persisted@test.com" },
      token: "mock-jwt-token"
    };
    localStorage.setItem("auth", JSON.stringify(mockAuthData));

    const AuthStatus = () => {
      const [auth] = require("../context/auth").useAuth();
      return auth?.user ? <div>User: {auth.user.name}</div> : <div>No User</div>;
    };

    render(
      <AuthProvider>
        <AuthStatus />
      </AuthProvider>
    );

    expect(screen.getByText("User: Persisted User")).toBeInTheDocument();
    expect(axios.defaults.headers.common["Authorization"]).toBe("mock-jwt-token");
  });

  it("should prevent API calls and show validation errors for invalid email formats", async () => {
    render(
      <AuthProvider>
        <SearchProvider>
          <CartProvider>
            <MemoryRouter initialEntries={["/login"]}>
              <Login />
            </MemoryRouter>
          </CartProvider>
        </SearchProvider>
      </AuthProvider>
    );
  
    fireEvent.change(screen.getByPlaceholderText(/email/i), { 
      target: { value: "invalid-email-format" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { 
      target: { value: "password123" } 
    });
    fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));
  
    const errorMessage = await screen.findByText(/Please enter a valid email address/i);
    expect(errorMessage).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });
});