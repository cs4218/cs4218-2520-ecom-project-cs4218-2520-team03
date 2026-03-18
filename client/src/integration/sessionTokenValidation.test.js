// Sun Zihan, A0259581R
import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/auth";
import PrivateRoute from "../components/Routes/Private";
import "@testing-library/jest-dom";

jest.mock("axios");

jest.mock("../components/Spinner", () => {
  return function DummySpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

describe("Integration: Session Persistence and Token Validation", () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation((msg) => {
      if (typeof msg === 'string' && msg.includes('React Router Future Flag Warning')) {
        return;
      }
      process.stdout.write(msg + '\n');
    });
  });

  afterAll(() => {
    console.warn.mockRestore(); 
  });
  
  const mockUser = { _id: "123", name: "John Doe", role: 0 };
  const mockToken = "mock-valid-jwt-token";

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    axios.defaults = { headers: { common: {} } };
  });

  it("should restore session from localStorage and permit access to PrivateRoute", async () => {
    const authData = { user: mockUser, token: mockToken };
    localStorage.setItem("auth", JSON.stringify(authData));

    axios.get.mockResolvedValue({ data: { ok: true } });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });
    
    expect(await screen.findByText("Protected Content")).toBeInTheDocument();
  });

  it("should deny access and show Spinner when token validation fails (401)", async () => {
    localStorage.setItem("auth", JSON.stringify({ user: mockUser, token: "invalid-token" }));
    
    axios.get.mockResolvedValue({ data: { ok: false } });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should synchronize Axios global headers immediately upon AuthProvider initialization", async () => {
    const authData = { user: mockUser, token: mockToken };
    localStorage.setItem("auth", JSON.stringify(authData));

    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe(mockToken);
    });
  });

  it("should correctly handle isAdmin logic based on user model role field", async () => {
    const { isAdmin } = require("../../../middlewares/authMiddleware");
    const userModel = require("../../../models/userModel").default;

    const req = { user: { _id: "123" } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const next = jest.fn();

    jest.spyOn(userModel, "findById").mockResolvedValue({ _id: "123", role: 0 });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      message: "UnAuthorized Access"
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it("should clear localStorage and reset auth state when token validation fails", async () => {
    const authData = { user: mockUser, token: "expired" };
    localStorage.setItem("auth", JSON.stringify(authData));
    
    axios.get.mockResolvedValue({ data: { ok: false } });
  
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<PrivateRoute />}>
              <Route path="" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth"));
  
    await waitFor(() => {
      const storedAuth = localStorage.getItem("auth");
      expect(storedAuth === null || JSON.parse(storedAuth).token === "").toBe(true);
    }, { timeout: 2000 });
  
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});