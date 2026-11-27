import { Fade } from "@animate-ui/react/primitives/effects/fade";
import { useReducedMotion } from "motion/react";
import { Check } from "lucide-react";

/** Loaded only after a successful UUID bulk copy; never owns the clipboard or focus. */
export function UuidCopyFeedback() {
  const reduce = useReducedMotion();
  return (
    <Fade asChild initialOpacity={reduce ? 1 : 0} transition={{ duration: reduce ? 0 : 0.15 }}>
      <span aria-hidden="true" data-icon="copied" data-uuid-feedback="animate-ui">
        <Check size={16} />
      </span>
    </Fade>
  );
}
