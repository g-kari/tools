import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS classes.
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class name string with Tailwind conflicts resolved
 *
 * @example
 * cn("px-2 py-1", condition && "bg-blue-500", { "text-white": isActive })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
