import { render, screen, waitFor } from "@testing-library/react";
import { App, ConfigProvider } from "antd";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecordsClient } from "@/app/(protected)/profile/records/RecordsClient/RecordsClient";
import { RECORDS_LABELS } from "@/app/(protected)/profile/records/RecordsClient/constants/recordsConstants";

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

function renderClient(props: ComponentProps<typeof RecordsClient> = {}) {
  return render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <App>
        <RecordsClient {...props} />
      </App>
    </ConfigProvider>
  );
}

describe("RecordsClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders profile navigation and selects the first completed record", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        records: [
          {
            distanceKey: "10k",
            timeText: "00:39:00",
            recordDate: "2026-05-10",
            protocolUrl: null,
            raceName: null,
            raceCity: null,
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    renderClient();

    expect(screen.getByRole("heading", { level: 1, name: RECORDS_LABELS.title })).toBeTruthy();
    const backLink = screen.getByRole("link", { name: RECORDS_LABELS.backButton });
    expect(backLink.getAttribute("href")).toBe("/profile");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "10 км" })).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/personal-records", {
      cache: "no-store",
    });
  });

  it("omits profile chrome and uses the supplied API in embedded mode", async () => {
    const apiUrl = "/api/admin/users/user-1/records";
    const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ records: [] }));
    vi.stubGlobal("fetch", fetchMock);

    renderClient({ apiUrl, variant: "embedded" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "5 км" })).toBeTruthy();
    });

    expect(screen.queryByRole("heading", { level: 1, name: RECORDS_LABELS.title })).toBeNull();
    expect(screen.queryByRole("link", { name: RECORDS_LABELS.backButton })).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(apiUrl, {
      cache: "no-store",
    });
  });
});
