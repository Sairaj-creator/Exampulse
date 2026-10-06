import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../App";

vi.mock("../lib/api", () => ({
  getHealth: vi.fn().mockResolvedValue({ db: "connected" }),
}));

vi.mock("../features/auth/api", () => ({
  getMeApi: vi.fn().mockResolvedValue(null),
  getBatchesApi: vi.fn().mockResolvedValue([]),
  loginApi: vi.fn(),
  registerApi: vi.fn(),
  logoutApi: vi.fn(),
  updateMeApi: vi.fn(),
  updatePasswordApi: vi.fn(),
}));

it("shows the API health state on the foundation page", async () => {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(
    await screen.findByText("Your foundation is connected."),
  ).toBeInTheDocument();
});

it("renders the login page with credentials form", async () => {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText("Welcome back")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("you@exampulse.dev")).toBeInTheDocument();
});
