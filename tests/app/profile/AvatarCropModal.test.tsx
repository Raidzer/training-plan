import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import type { CropperProps } from "react-easy-crop";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cropperProps: CropperProps | undefined;

vi.mock("react-easy-crop", () => ({
  default: (props: CropperProps) => {
    cropperProps = props;
    return <div {...props.cropperProps} />;
  },
}));

import { AvatarCropModal } from "@/app/(protected)/profile/ProfileClient/components/AvatarCropModal/AvatarCropModal";

describe("AvatarCropModal", () => {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);

  beforeEach(() => {
    cropperProps = undefined;
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
      originalGetComputedStyle(element)
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it("не сохраняет прежнюю геометрию после изменения масштаба и ждёт нового расчёта", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <AvatarCropModal
          source={{ url: "blob:source", image: {} as HTMLImageElement }}
          saving={false}
          error={null}
          onCancel={() => {}}
          onSave={save}
        />
      </ConfigProvider>
    );
    await waitFor(() => expect(cropperProps).toBeDefined());
    const saveButton = screen.getByRole("button", { name: "Сохранить фото" }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    const oldArea = { x: 0, y: 0, width: 800, height: 800 };
    const previousCropperProps = cropperProps!;
    act(() => previousCropperProps.onCropAreaChange?.(oldArea, oldArea));
    expect(saveButton.disabled).toBe(false);

    act(() => {
      previousCropperProps.onZoomChange?.(2);
      previousCropperProps.onCropAreaChange?.(oldArea, oldArea);
    });
    expect(saveButton.disabled).toBe(true);
    fireEvent.click(saveButton);
    expect(save).not.toHaveBeenCalled();

    const newArea = { x: 200, y: 200, width: 400, height: 400 };
    act(() => cropperProps!.onCropAreaChange?.(newArea, newArea));
    expect(saveButton.disabled).toBe(false);
    fireEvent.click(saveButton);
    expect(save).toHaveBeenCalledWith(newArea);
    expect(
      screen.getByRole("slider", { name: "Масштаб фотографии" }).getAttribute("aria-valuenow")
    ).toBe("2");
  });
});
