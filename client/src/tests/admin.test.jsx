import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { UsersPage } from "../pages/admin/UsersPage";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      _id: "admin-1",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../features/admin/api", () => ({
  listUsersApi: vi.fn().mockResolvedValue({
    users: [
      {
        _id: "teacher-1",
        name: "Ada Teacher",
        email: "ada@example.com",
        role: "teacher",
        isActive: true,
        batchId: null,
      },
    ],
    meta: { page: 1, totalPages: 1, total: 1 },
  }),
  listBatchesApi: vi
    .fn()
    .mockResolvedValue([{ _id: "batch-1", name: "CSE-A 2027", year: 2027 }]),
  createUserApi: vi.fn(),
  updateUserApi: vi.fn(),
  updateUserStatusApi: vi.fn(),
  resetUserPasswordApi: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it("renders the user directory and opens the create form", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admin/users"]}>
        <UsersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect(await screen.findAllByText("Ada Teacher")).not.toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: /create user/i }));
  expect(
    screen.getByRole("dialog", { name: /create a user/i }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
});
