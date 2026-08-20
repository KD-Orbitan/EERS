'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className = '', sideOffset = 8, ...props }: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={`z-50 min-w-[190px] rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200 ${className}`}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className = '', ...props }: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 outline-none transition data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700 ${className}`}
      {...props}
    />
  );
}
