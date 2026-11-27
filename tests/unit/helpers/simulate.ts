/**
 * `react-dom/test-utils` の `Simulate.change` の代替。
 *
 * React 19 で `Simulate` が削除されたため、単体テストが使っていた
 * `change` だけを DOM イベントで再現する。呼び出し側の2つの流儀に対応する:
 *
 * 1. 要素の `value` / `checked` を直接設定してから `Simulate.change(el)` を呼ぶ
 * 2. `Simulate.change(el, { target: { value } })` のようにイベントデータで渡す
 *
 * React は入力値をトラッキングしており、直接設定しただけでは `input`
 * イベントを流しても `onChange` が発火しない。そのため発火前にトラッカーを
 * 現在値からずらし、ネイティブ setter 経由の設定でトラッカーを汚さない。
 */

interface SimulateChangeEventData {
  target?: {
    value?: string;
    checked?: boolean;
  };
}

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

interface ValueTracker {
  setValue(value: string): void;
}

function setValueBypassingTracker(control: FormControl, value: string): void {
  const prototype = Object.getPrototypeOf(control) as object;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(control, value);
  } else {
    control.value = value;
  }
}

function desyncValueTracker(control: FormControl): void {
  const tracker = (control as { _valueTracker?: ValueTracker })._valueTracker;
  if (!tracker) {
    return;
  }
  if (
    control instanceof HTMLInputElement &&
    (control.type === "checkbox" || control.type === "radio")
  ) {
    // React は checkable な input では checked を "true"/"false" で追跡する
    tracker.setValue(control.checked ? "false" : "true");
  } else if ("value" in control) {
    tracker.setValue(control.value === "" ? " " : "");
  }
}

export const Simulate = {
  change(target: Element, eventData?: SimulateChangeEventData): void {
    const control = target as FormControl;
    const data = eventData?.target;
    if (data) {
      if (typeof data.value === "string") {
        setValueBypassingTracker(control, data.value);
      }
      if (typeof data.checked === "boolean" && control instanceof HTMLInputElement) {
        control.checked = data.checked;
      }
    }
    if ("value" in control) {
      desyncValueTracker(control);
    }
    if (
      control instanceof HTMLInputElement &&
      (control.type === "checkbox" || control.type === "radio")
    ) {
      // React は checkbox/radio の onChange を click イベントから生成する
      control.dispatchEvent(new Event("click", { bubbles: true }));
    } else if (
      control instanceof HTMLSelectElement ||
      (control instanceof HTMLInputElement && control.type === "file")
    ) {
      // select と file input は change イベントだけが対象（二重発火を避ける）
      control.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
  },
};
