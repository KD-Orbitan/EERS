'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded-t-xl rounded-b-none border-0 border-b-2 border-ink-300 bg-ink-100 py-2 pl-3 pr-10 outline-none transition-colors duration-200 focus:border-primary-600 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
