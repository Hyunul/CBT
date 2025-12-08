// cbt-fe/components/Input.tsx
"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, ...props }, ref) => {
    return (
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <input id={id} className="input" ref={ref} {...props} />
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
