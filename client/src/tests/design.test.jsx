import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { MotionToggle } from "../components/ui/MotionToggle";
import { Switch } from "../components/ui/Switch";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { FormDialog } from "../components/common/FormDialog";
import { AtRiskStudentsList } from "../features/analytics/AtRiskStudentsList";
import { LoginPage } from "../pages/LoginPage";
import { toApiError } from "../lib/api";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: null, login: vi.fn() }),
}));

describe("Theme, motion and shared UI behaviour", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.motion;
  });

  afterEach(() => {
    cleanup();
  });

  it("switches between light and dark and remembers the choice", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const toggle = screen.getByRole("switch", { name: "Dark theme" });

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem("ep-theme")).toBe("dark");

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("ep-theme")).toBe("light");
  });

  it("restores a saved dark theme on load", () => {
    window.localStorage.setItem("ep-theme", "dark");
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("switch", { name: "Dark theme" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("turns animations off and on and remembers the choice", () => {
    render(
      <ThemeProvider>
        <MotionToggle />
      </ThemeProvider>,
    );
    const toggle = screen.getByRole("switch", { name: "Animations" });

    expect(document.documentElement.dataset.motion).toBe("on");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.motion).toBe("off");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(window.localStorage.getItem("ep-motion")).toBe("off");

    fireEvent.click(toggle);
    expect(document.documentElement.dataset.motion).toBe("on");
  });

  it("renders Switch as a real checkbox that a label can toggle", () => {
    const onChange = vi.fn();
    render(
      <label>
        Shuffle questions
        <Switch checked={false} onChange={onChange} />
      </label>,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /shuffle questions/i,
    });
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("closes dialogs when Escape is pressed", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Delete batch?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // A dialog in the middle of its action must not be dismissed.
    rerender(
      <ConfirmDialog
        open
        busy
        title="Delete batch?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    const onFormClose = vi.fn();
    render(
      <FormDialog open title="Create batch" onClose={onFormClose}>
        <p>Form body</p>
      </FormDialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onFormClose).toHaveBeenCalledTimes(1);
  });

  it("fills demo credentials and toggles password visibility on the login page", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Teacher" }));
    expect(screen.getByLabelText("Email Address")).toHaveValue(
      "teacher1@exampulse.dev",
    );

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("lists the students furthest below their pass mark first", () => {
    render(
      <MemoryRouter>
        <AtRiskStudentsList
          atRisk={[
            {
              studentId: "a",
              studentName: "Near Miss",
              recentAverage: 48,
              passThreshold: 50,
            },
            {
              studentId: "b",
              studentName: "Far Below",
              recentAverage: 20,
              passThreshold: 50,
            },
          ]}
        />
      </MemoryRouter>,
    );
    const names = screen
      .getAllByText(/Near Miss|Far Below/)
      .map((node) => node.textContent);
    expect(names).toEqual(["Far Below", "Near Miss"]);
  });
});

describe("toApiError", () => {
  it("replaces a generic validation message with the field messages", () => {
    const error = toApiError({
      response: {
        status: 400,
        data: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation error",
            details: [
              {
                path: "password",
                message:
                  "Password must contain at least one letter and one number",
              },
              { path: "batchId", message: "Required" },
            ],
          },
        },
      },
    });
    expect(error.message).toBe(
      "Password must contain at least one letter and one number batchId is required.",
    );
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("keeps the server message for other errors", () => {
    const error = toApiError({
      response: {
        status: 409,
        data: { error: { code: "CONFLICT", message: "Email already exists" } },
      },
    });
    expect(error).toEqual({
      code: "CONFLICT",
      message: "Email already exists",
    });
  });

  it("describes a failure with no response as a network error", () => {
    const error = toApiError({ message: "Network Error" });
    expect(error).toEqual({ code: "NETWORK_ERROR", message: "Network Error" });
  });
});
