import { useState, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { useClipboard } from "../../../../app/hooks/useClipboard";
import "./styles.css";

const payload = "synthetic clipboard payload α🙂\nline two";

/** Exercise the actual hook through click and keyboard user activation. */
function ClipboardFixture() {
  const { copy } = useClipboard();
  const [result, setResult] = useState({ sequence: 0, value: "idle" });

  const handleCopy = async () => {
    const success = await copy(payload);
    setResult((previous) => ({
      sequence: previous.sequence + 1,
      value: String(success),
    }));
  };

  const handleShortcut = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      void handleCopy();
    }
  };

  return (
    <section onKeyDown={handleShortcut}>
      <h1>Clipboard regression fixture</h1>
      <p>Use the button or Control+Alt+C to copy synthetic text.</p>
      <button id="copy" type="button" onClick={() => void handleCopy()}>
        Copy synthetic text
      </button>
      <output data-testid="result" aria-live="polite">
        {result.sequence}:{result.value}
      </output>
      <label htmlFor="input">Single-line selection</label>
      <input id="input" defaultValue={"synthetic input selection ".repeat(20)} />
      <label htmlFor="textarea">Multiline selection</label>
      <textarea
        id="textarea"
        defaultValue={Array.from(
          { length: 30 },
          (_, index) => `synthetic line ${index}: ${"horizontal content ".repeat(16)}`,
        ).join("\n")}
      />
      <div id="editable" contentEditable suppressContentEditableWarning tabIndex={0}>
        <span id="editable-start">synthetic editable beginning</span>
        {" middle "}
        <span id="editable-end">synthetic editable ending</span>
      </div>
      <p id="content" tabIndex={0}>
        <span id="content-start">synthetic DOM beginning</span>
        {" middle "}
        <span id="content-end">synthetic DOM ending</span>
      </p>
      <label htmlFor="paste">Native paste verification</label>
      <textarea id="paste" />
      <div className="spacer" aria-hidden="true" />
    </section>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing clipboard fixture root");
createRoot(root).render(<ClipboardFixture />);
