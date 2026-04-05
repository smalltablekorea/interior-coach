"use client";

import { useRef, useState, useCallback, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface KoreanInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export function KoreanInput({ value, onChange, ...props }: KoreanInputProps) {
  const composingRef = useRef(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes
  if (!composingRef.current && localValue !== value) {
    setLocalValue(value);
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (!composingRef.current) {
      onChange(e.target.value);
    }
  }, [onChange]);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement>) => {
    composingRef.current = false;
    onChange(e.currentTarget.value);
  }, [onChange]);

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  );
}

interface KoreanTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export function KoreanTextarea({ value, onChange, ...props }: KoreanTextareaProps) {
  const composingRef = useRef(false);
  const [localValue, setLocalValue] = useState(value);

  if (!composingRef.current && localValue !== value) {
    setLocalValue(value);
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    if (!composingRef.current) {
      onChange(e.target.value);
    }
  }, [onChange]);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    onChange(e.currentTarget.value);
  }, [onChange]);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
    />
  );
}
