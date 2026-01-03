import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * InfoBox section configuration
 */
export interface InfoBoxSection {
  /** Section title */
  title: string;
  /** List items or content */
  items: string[];
}

/**
 * InfoBox props
 */
export interface InfoBoxProps {
  /** Array of sections to display */
  sections: InfoBoxSection[];
  /** Additional CSS classes */
  className?: string;
  /** Custom aria-labelledby ID (defaults to first section title) */
  ariaLabelledBy?: string;
}

/**
 * InfoBox component for displaying tips and information
 *
 * A reusable component that displays informational sections in a consistent format.
 * Used across the application to show usage tips, explanations, and help content.
 *
 * @example
 * ```tsx
 * <InfoBox
 *   sections={[
 *     { title: "UUIDとは", items: ["UUID is...", "This tool uses..."] },
 *     { title: "使い方", items: ["Click to generate...", "Copy to clipboard..."] }
 *   ]}
 * />
 * ```
 */
export function InfoBox({ sections, className, ariaLabelledBy }: InfoBoxProps) {
  const firstTitleId = sections[0]?.title
    ? `info-${sections[0].title.toLowerCase().replace(/\s+/g, "-")}`
    : "info-title";

  return (
    <aside
      className={cn("info-box", className)}
      role="complementary"
      aria-labelledby={ariaLabelledBy || firstTitleId}
    >
      {sections.map((section, sectionIndex) => {
        const titleId =
          sectionIndex === 0 && !ariaLabelledBy
            ? firstTitleId
            : `info-${section.title.toLowerCase().replace(/\s+/g, "-")}-${sectionIndex}`;

        return (
          <React.Fragment key={sectionIndex}>
            <h3 id={titleId}>{section.title}</h3>
            <ul>
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </React.Fragment>
        );
      })}
    </aside>
  );
}
