import { describe, expect, it, vi } from "vite-plus/test";

import { listenForDoubleEscapeStop } from "./doubleEscapeStop";

function pressEscape(target: EventTarget) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

function listen(target: EventTarget, handler: (event: Event) => void) {
  target.addEventListener("keydown", handler);
  return { [Symbol.dispose]: () => target.removeEventListener("keydown", handler) };
}

describe("listenForDoubleEscapeStop", () => {
  it("stops on two plain presses", () => {
    const onStop = vi.fn();
    using _stop = {
      [Symbol.dispose]: listenForDoubleEscapeStop(window, { canStop: () => true, onStop }),
    };
    pressEscape(document.body);
    pressEscape(document.body);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("ignores a first press claimed by a later listener", () => {
    const onStop = vi.fn();
    using _stop = {
      [Symbol.dispose]: listenForDoubleEscapeStop(window, { canStop: () => true, onStop }),
    };
    let findOpen = true;
    using _find = listen(window, (event) => {
      if (findOpen) {
        findOpen = false;
        event.preventDefault();
      }
    });
    pressEscape(document.body);
    pressEscape(document.body);
    expect(onStop).not.toHaveBeenCalled();
  });

  it("ignores presses in other text fields", () => {
    const onStop = vi.fn();
    using _stop = {
      [Symbol.dispose]: listenForDoubleEscapeStop(window, { canStop: () => true, onStop }),
    };
    const rename = document.createElement("input");
    document.body.append(rename);
    using _rename = { [Symbol.dispose]: () => rename.remove() };
    pressEscape(rename);
    pressEscape(document.body);
    expect(onStop).not.toHaveBeenCalled();
  });
});
