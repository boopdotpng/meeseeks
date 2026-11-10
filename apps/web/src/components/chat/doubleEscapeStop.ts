const DOUBLE_ESCAPE_WINDOW_MS = 500;
const OTHER_EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]';
const OVERLAY_SELECTOR = '[role="dialog"],[role="menu"],[role="listbox"]';

/** Calls `onStop` when Escape is pressed twice in a row without either press doing anything else. */
export function listenForDoubleEscapeStop(
  target: EventTarget,
  input: { readonly canStop: () => boolean; readonly onStop: () => void },
): () => void {
  let previous: KeyboardEvent | null = null;
  const onKeyDown = (event: Event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key !== "Escape" || event.repeat || event.isComposing) return;
    const element = event.target instanceof Element ? event.target : null;
    const escapeDidSomethingElse =
      event.defaultPrevented ||
      element?.closest(OVERLAY_SELECTOR) != null ||
      (element?.closest(OTHER_EDITABLE_SELECTOR) != null &&
        element.closest('[data-chat-composer-form="true"]') == null);
    if (escapeDidSomethingElse || !input.canStop()) {
      previous = null;
      return;
    }
    // Listeners registered after this one (thread find) may claim an Escape, so the
    // first press is judged once its dispatch has finished.
    if (
      previous !== null &&
      !previous.defaultPrevented &&
      event.timeStamp - previous.timeStamp < DOUBLE_ESCAPE_WINDOW_MS
    ) {
      previous = null;
      input.onStop();
      return;
    }
    previous = event;
  };
  target.addEventListener("keydown", onKeyDown);
  return () => target.removeEventListener("keydown", onKeyDown);
}
