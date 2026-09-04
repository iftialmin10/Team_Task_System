import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { server } from "./mocks/server";

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderApp(entry = "/work") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("core browse experience", () => {
  it("loads a URL-backed, paginated work list", async () => {
    renderApp("/work?status=in_progress&pageSize=50");
    expect(
      await screen.findByRole("heading", { name: "Team work" }),
    ).toBeTruthy();
    expect(await screen.findByText("90 items in this view")).toBeTruthy();
    expect(screen.getByLabelText("Status")).toHaveProperty(
      "value",
      "IN_PROGRESS",
    );
    expect(screen.getByTestId("location").textContent).toBe(
      "/work?status=in_progress&pageSize=50",
    );
  });

  it("debounces search into the URL and shows a filtered result", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    await user.type(
      screen.getByRole("searchbox", { name: "Search by work item or owner" }),
      "onboarding",
    );
    expect(await screen.findByText("1 item in this view", {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toContain(
      "search=onboarding",
    );
    expect(
      screen.getAllByText(/Prepare customer onboarding guide/).length,
    ).toBeGreaterThan(0);
  });

  it("applies mobile filter drafts together", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    await user.click(screen.getByRole("button", { name: "Filters" }));
    await user.selectOptions(
      screen.getByLabelText("Priority", { selector: "#mobile-priority" }),
      "URGENT",
    );
    expect(screen.getByTestId("location").textContent).toBe("/work");
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(await screen.findByText("120 items in this view")).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe(
      "/work?priority=urgent",
    );
  });

  it("copies a link that preserves the current filtered view", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderApp("/work?status=in_progress&sort=updatedAt&order=desc&page=2&pageSize=50");
    await screen.findByText("90 items in this view");
    await user.click(screen.getByRole("button", { name: "Share With Colleagues" }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/work?status=in_progress&sort=updatedAt&order=desc&page=2&pageSize=50`,
    );
    expect(screen.getByText("Link copied")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText("Link copied")).toBeNull(), {
      timeout: 3500,
    });
  });

  it("keeps keyboard focus contained inside the mobile filter sheet", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const dialog = screen.getByRole("dialog", { name: "Filter and sort" });
    const closeButton = within(dialog).getByRole("button", { name: "Close" });
    expect(document.activeElement).toBe(closeButton);
    await user.tab();
    expect(document.activeElement).toBe(within(dialog).getByLabelText("Owner"));
    await user.tab();
    expect(document.activeElement).toBe(
      within(dialog).getByLabelText("Status"),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      within(dialog).getByLabelText("Priority"),
    );
    await user.tab();
    expect(document.activeElement).toBe(within(dialog).getByLabelText("Due"));
    await user.tab();
    expect(document.activeElement).toBe(
      within(dialog).getByLabelText("Sort by"),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: "Reset" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(
      within(dialog).getByRole("button", { name: "Apply filters" }),
    );
    await user.tab();
    expect(document.activeElement).toBe(closeButton);
  });

  it("distinguishes filtered-empty and retryable error states", async () => {
    renderApp("/work?search=definitely-not-present");
    expect(
      await screen.findByRole("heading", { name: "No work matches this view" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Clear search and filters" }),
    ).toBeTruthy();

    server.use(
      http.get("*/api/work-items", () =>
        HttpResponse.json(
          { error: { message: "Unavailable" } },
          { status: 503 },
        ),
      ),
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "another" },
    });
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy(), {
      timeout: 1500,
    });
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});

describe("core mutations", () => {
  it("matches and selects an owner by typing only in the Add work dialog", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    await user.click(screen.getByRole("button", { name: "Add work" }));

    const dialog = screen.getByRole("dialog", { name: "Add work" });
    const owner = within(dialog).getByRole("combobox", { name: "Owner" });
    expect(owner.tagName).toBe("INPUT");

    await user.type(owner, "sam");
    expect(within(dialog).getByRole("option", { name: /Samira Khan/ })).toBeTruthy();
    expect(within(dialog).queryByRole("option", { name: /Alexandra Montgomery-Jones/ })).toBeNull();

    await user.keyboard("{ArrowDown}{Enter}");
    expect((owner as HTMLInputElement).value).toBe("Samira Khan");
    expect(owner.getAttribute("aria-expanded")).toBe("false");
  });

  it("creates a work item and preserves the form until the request succeeds", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    await user.click(screen.getByRole("button", { name: "Add work" }));
    const dialog = screen.getByRole("dialog", { name: "Add work" });
    expect(dialog).toBeTruthy();
    await user.type(screen.getByLabelText(/Title/), "Coordinate launch review");
    await user.selectOptions(within(dialog).getByLabelText("Priority"), "HIGH");
    await user.click(within(dialog).getByRole("button", { name: "Add work" }));
    expect(
      await screen.findByText(
        "Coordinate launch review was added to the backlog.",
      ),
    ).toBeTruthy();
    expect(await screen.findByText("361 items in this view")).toBeTruthy();
  });

  it("restores a URL-linked detail view and edits essential fields", async () => {
    const user = userEvent.setup();
    renderApp("/work?item=mock_001");
    const dialog = await screen.findByRole("dialog", {
      name: /Prepare customer onboarding guide/,
    });
    expect(screen.getByTestId("location").textContent).toContain(
      "item=mock_001",
    );
    await user.click(screen.getByRole("button", { name: "Edit work" }));
    expect(within(dialog).getByLabelText("Owner").tagName).toBe("SELECT");
    const description = screen.getByLabelText(/Description/);
    await user.clear(description);
    await user.type(description, "Updated launch details");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Updated launch details")).toBeTruthy();
    expect(dialog).toBeTruthy();
  });

  it("rolls back a failed optimistic status change and offers retry", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("*/api/work-items/:id/status", () =>
        HttpResponse.json(
          { error: { message: "Status service unavailable" } },
          { status: 503 },
        ),
      ),
    );
    renderApp();
    await screen.findByText("360 items in this view");
    const controls = screen.getAllByRole("combobox", {
      name: "Change status for Mock work item 30",
    });
    await user.selectOptions(controls[0]!, "IN_PROGRESS");
    expect(await screen.findAllByText(/Update failed/)).toHaveLength(2);
    await waitFor(() =>
      expect(
        screen.getAllByRole("combobox", {
          name: "Change status for Mock work item 30",
        }).length,
      ).toBe(2),
    );
    expect(
      screen.getAllByRole("button", { name: "Retry" }).length,
    ).toBeGreaterThan(0);
  });

  it("changes priority from the inline dropdown", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    const controls = screen.getAllByRole("combobox", {
      name: "Change priority for Mock work item 30",
    });
    await user.selectOptions(controls[0]!, "URGENT");
    await waitFor(() => {
      expect(
        screen.getAllByRole("combobox", {
          name: "Change priority for Mock work item 30",
        }).every((control) => (control as HTMLSelectElement).value === "URGENT"),
      ).toBe(true);
    });
  });
});

describe("accessibility and responsive hardening", () => {
  it("restores focus and page scrolling when the filter sheet closes", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    const trigger = screen.getByRole("button", { name: "Filters" });

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(
      within(screen.getByRole("dialog", { name: "Filter and sort" })).getByRole("button", { name: "Close" }),
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Filter and sort" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("focuses and announces invalid form fields, then restores dialog focus", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByText("360 items in this view");
    const trigger = screen.getByRole("button", { name: "Add work" });

    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Add work" });
    const title = within(dialog).getByRole("textbox", { name: /Title/ });
    expect(document.activeElement).toBe(title);

    await user.click(within(dialog).getByRole("button", { name: "Add work" }));
    const error = within(dialog).getByRole("alert");
    expect(error.textContent).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(title.getAttribute("aria-invalid")).toBe("true");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Add work" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
