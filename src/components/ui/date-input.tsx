"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateInput({ value, onChange, className, ...props }: DateInputProps) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-none cursor-pointer",
        value ? "bg-green-50" : "",
        "[&::-webkit-datetime-edit-fields-wrapper]:text-sm",
        "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
        "[&::-webkit-datetime-edit]:text-gray-900",
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
        className
      )}
      {...props}
    />
  );
} 