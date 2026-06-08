"use client";

import { Input, type InputProps } from "antd";
import { useState } from "react";

type TimeInputProps = Omit<InputProps, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function TimeInput({ value, onChange, onBlur, ...props }: TimeInputProps) {
  const [draftValue, setDraftValue] = useState("");
  const currentValue = value ?? draftValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue.length < currentValue.length) {
      setDraftValue(inputValue);
      onChange?.(inputValue);
      return;
    }

    const lastChar = inputValue.slice(-1);
    if (!/[\d:.]/.test(lastChar)) {
      return;
    }

    const [integerPart, fractionalPart] = inputValue.split(".");
    const digits = integerPart.replace(/\D/g, "").slice(0, 6);

    let formattedInt = "";

    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 2 === 0 && i < 6) {
        formattedInt += ":";
      }
      formattedInt += digits[i];
    }

    let finalValue = formattedInt;
    if (inputValue.includes(".")) {
      const cleanFraction = fractionalPart ? fractionalPart.slice(0, 2).replace(/\D/g, "") : "";
      finalValue += "." + cleanFraction;
    }

    setDraftValue(finalValue);
    onChange?.(finalValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (/^\d{2}:\d{2}$/.test(val)) {
      val = "00:" + val;
      setDraftValue(val);
      onChange?.(val);
    } else if (/^\d{2}:\d{2}\.\d{1,2}$/.test(val)) {
      val = "00:" + val;
      setDraftValue(val);
      onChange?.(val);
    }

    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      value={currentValue}
      onChange={handleChange}
      onBlur={handleBlur}
      inputMode="numeric"
    />
  );
}
