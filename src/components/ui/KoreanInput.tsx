"use client";

import { useRef, useEffect, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

/**
 * Uncontrolled input that works with Korean IME.
 * Uses ref-based sync to avoid re-render during composition.
 */
interface KoreanInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  value: string;
  onChange: (value: string) => void;
}

export function KoreanInput({ value, onChange, ...props }: KoreanInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  // Keep refs fresh without causing re-render
  onChangeRef.current = onChange;
  valueRef.current = value;

  // Sync external value → DOM (only when not focused / composing)
  useEffect(() => {
    const el = ref.current;
    if (!el || el === document.activeElement) return;
    if (el.value !== value) el.value = value;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleInput = () => {
      onChangeRef.current(el.value);
    };

    // Use 'input' event — fires after IME composition is resolved
    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
  }, []);

  return (
    <input
      ref={ref}
      defaultValue={value}
      {...props}
    />
  );
}

interface KoreanTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "defaultValue"> {
  value: string;
  onChange: (value: string) => void;
}

export function KoreanTextarea({ value, onChange, ...props }: KoreanTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el || el === document.activeElement) return;
    if (el.value !== value) el.value = value;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleInput = () => {
      onChangeRef.current(el.value);
    };

    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
  }, []);

  return (
    <textarea
      ref={ref}
      defaultValue={value}
      {...props}
    />
  );
}
