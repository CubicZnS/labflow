import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", service: "labflow-api", version: "0.1.0" }),
      }),
    );
  });

  it("renders the product shell", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /从原始实验数据/ })).toBeInTheDocument();
    expect(screen.getByText("LabFlow")).toBeInTheDocument();
    expect(await screen.findByText(/API 已连接/)).toBeInTheDocument();
  });

  it("shows the API connection state", async () => {
    render(<App />);
    expect(await screen.findByText(/API 已连接/)).toBeInTheDocument();
  });
});