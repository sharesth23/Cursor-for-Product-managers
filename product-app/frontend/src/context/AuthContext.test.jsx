import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

vi.mock("jwt-decode");

const mockNavigate = vi.fn();
let mockLocation = { pathname: "/" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const TestComponent = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="user">{user ? user.role : "No user"}</div>
      <button onClick={() => login("fake-token")} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLocation = { pathname: "/" };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles migration of old non-JWT state by removing 'last-open-project-id'", async () => {
    localStorage.setItem("last-open-project-id", "123");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem("last-open-project-id")).toBeNull();
    });
  });

  it("sets user if valid token exists in localStorage", async () => {
    localStorage.setItem("auth-token", "valid-token");
    const mockDecoded = { role: "user", exp: (Date.now() / 1000) + 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("user");
    });
  });

  it("logs out if token is expired", async () => {
    localStorage.setItem("auth-token", "expired-token");
    const mockDecoded = { role: "user", exp: (Date.now() / 1000) - 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem("auth-token")).toBeNull();
      expect(screen.getByTestId("user").textContent).toBe("No user");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("logs out if decoding token fails", async () => {
    localStorage.setItem("auth-token", "invalid-token");
    jwtDecode.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem("auth-token")).toBeNull();
      expect(screen.getByTestId("user").textContent).toBe("No user");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("login sets token, decodes user, and navigates based on role (super_admin)", async () => {
    const user = userEvent.setup();
    const mockDecoded = { role: "super_admin", exp: (Date.now() / 1000) + 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = await screen.findByTestId("login-btn");
    await user.click(loginBtn);

    expect(localStorage.getItem("auth-token")).toBe("fake-token");
    expect(screen.getByTestId("user").textContent).toBe("super_admin");
    expect(mockNavigate).toHaveBeenCalledWith("/super-admin/dashboard");
  });

  it("login sets token, decodes user, and navigates based on role (company_slug)", async () => {
    const user = userEvent.setup();
    const mockDecoded = { role: "user", company_slug: "acme", exp: (Date.now() / 1000) + 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = await screen.findByTestId("login-btn");
    await user.click(loginBtn);

    expect(localStorage.getItem("auth-token")).toBe("fake-token");
    expect(screen.getByTestId("user").textContent).toBe("user");
    expect(mockNavigate).toHaveBeenCalledWith("/acme/dashboard");
  });

  it("logout removes token and redirects to /login", async () => {
    localStorage.setItem("auth-token", "valid-token");
    const mockDecoded = { role: "user", exp: (Date.now() / 1000) + 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("user");
    });

    const logoutBtn = await screen.findByTestId("logout-btn");
    await user.click(logoutBtn);

    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("No user");
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("logout does not redirect if already on login page", async () => {
    mockLocation = { pathname: "/login" };
    localStorage.setItem("auth-token", "valid-token");
    const mockDecoded = { role: "user", exp: (Date.now() / 1000) + 1000 };
    jwtDecode.mockReturnValue(mockDecoded);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("user");
    });

    const logoutBtn = await screen.findByTestId("logout-btn");
    await user.click(logoutBtn);

    expect(localStorage.getItem("auth-token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("No user");
    expect(mockNavigate).not.toHaveBeenCalled(); // Because we are already on /login
  });
});
