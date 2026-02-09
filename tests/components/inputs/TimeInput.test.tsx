import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimeInput } from "@/components/inputs/TimeInput";

describe("components/inputs/TimeInput", () => {
  it("должен форматировать обычные цифры как строку времени", () => {
    const onChange = vi.fn();
    render(<TimeInput onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "1234" } });

    expect((input as HTMLInputElement).value).toBe("12:34");
    expect(onChange).toHaveBeenLastCalledWith("12:34");
  });

  it("должен игнорировать неподдерживаемые символы", () => {
    const onChange = vi.fn();
    render(<TimeInput onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "12" } });
    const beforeCalls = onChange.mock.calls.length;
    fireEvent.change(input, { target: { value: "12a" } });

    expect((input as HTMLInputElement).value).toBe("12");
    expect(onChange.mock.calls.length).toBe(beforeCalls);
  });

  it("должен добавлять префикс часов при blur для паттерна MM:SS", () => {
    const onChange = vi.fn();
    render(<TimeInput value="12:34" onChange={onChange} />);
    const input = screen.getByRole("textbox");

    fireEvent.blur(input);

    expect(onChange).toHaveBeenLastCalledWith("00:12:34");
  });
});
