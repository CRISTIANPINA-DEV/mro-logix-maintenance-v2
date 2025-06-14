import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface AutoCompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions: string[];
  onValueChange: (value: string) => void;
  onSuggestionSelect?: (value: string) => void;
  isValid?: boolean;
  errorMessage?: string;
}

export function AutoCompleteInput({
  suggestions,
  onValueChange,
  onSuggestionSelect,
  isValid,
  errorMessage,
  className,
  ...props
}: AutoCompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (value: string) => {
    onSuggestionSelect ? onSuggestionSelect(value) : onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        {...props}
        className={cn(
          "rounded-none cursor-pointer",
          isValid === false ? "border-red-500" : "",
          props.value ? "bg-green-50" : "",
          className
        )}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          onValueChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
      />
      {errorMessage && isValid === false && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                highlightedIndex === index ? "bg-gray-100" : ""
              )}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 