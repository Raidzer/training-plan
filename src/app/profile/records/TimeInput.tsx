"use client";

import { Input, type InputProps } from "antd";
import { useEffect, useState } from "react";

type TimeInputProps = Omit<InputProps, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function TimeInput({ value, onChange, onBlur, ...props }: TimeInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  useEffect(() => {
    setInternalValue(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Check if user is trying to delete (backspace)
    // If input is shorter than internal, just update
    if (inputValue.length < internalValue.length) {
      setInternalValue(inputValue);
      onChange?.(inputValue);
      return;
    }

    // Allow only digits and colons and dots
    // But for "smart" typing we mainly care about digits
    const lastChar = inputValue.slice(-1);
    if (!/[\d:.]/.test(lastChar)) {
      return;
    }

    // Auto-insert colon logic:
    // If we have 2 chars '12' and user types 3rd char, it becomes '12:' + char
    // Simple approach: strip all non-digit/dot, re-format.

    // Split integer and fractional parts
    const [integerPart, fractionalPart] = inputValue.split(".");

    // Filter non-digits from integer part (remove colons user might have deleted or re-typed)
    const digits = integerPart.replace(/\D/g, "").slice(0, 6);

    let formattedInt = "";
    // We want to group by 2.
    // 123 -> 12:3
    // 1234 -> 12:34
    // 12345 -> 12:34:5
    // 123456 -> 12:34:56

    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 2 === 0 && i < 6) {
        formattedInt += ":";
      }
      formattedInt += digits[i];
    }

    // If we have fractional part, append it
    // Allow strict one dot
    let finalValue = formattedInt;
    if (inputValue.includes(".")) {
      // limit fractional to 2 digits
      const cleanFraction = fractionalPart ? fractionalPart.slice(0, 2).replace(/\D/g, "") : "";
      finalValue += "." + cleanFraction;
    }

    setInternalValue(finalValue);
    onChange?.(finalValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Normalize on blur
    // MM:SS -> 00:MM:SS
    // HH:MM:SS -> leave as is
    // M:SS -> 00:0M:SS ? Or just validate.

    let val = e.target.value;

    // If it looks like MM:SS (e.g. 20:00), prepend 00:
    if (/^\d{2}:\d{2}$/.test(val)) {
      val = "00:" + val;
      setInternalValue(val);
      onChange?.(val);
    } else if (/^\d{2}:\d{2}\.\d{1,2}$/.test(val)) {
      val = "00:" + val;
      setInternalValue(val);
      onChange?.(val);
    }

    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      inputMode="numeric"
    />
  );
}
