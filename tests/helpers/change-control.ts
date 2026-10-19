/** Dispatch a real DOM edit instead of the React 18-only Simulate API. */
export function changeControl(
  element: Element,
  data?: { target?: { value?: string; checked?: boolean } },
) {
  if (element instanceof HTMLInputElement && element.type === "file") {
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  if (element instanceof HTMLSelectElement) {
    if (data?.target?.value !== undefined) element.value = data.target.value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }
  if (element instanceof HTMLInputElement && ["checkbox", "radio"].includes(element.type)) {
    const checked = data?.target?.checked ?? (element.type === "radio" ? true : element.checked);
    element.checked = !checked;
    element.click();
    return;
  }
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new TypeError("Expected an editable form control");
  }
  const value = data?.target?.value ?? element.value;
  // Tests may have assigned value already. Reset through the tracked setter first,
  // then use the browser's native setter to model a user edit before dispatching.
  element.value = value === "" ? "_" : "";
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}
