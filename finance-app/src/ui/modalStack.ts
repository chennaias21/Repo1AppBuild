/**
 * Makes sheets/dialogs close on the browser/Android back button instead of
 * leaving the page.
 *
 * Design: ALL open sheets share ONE history entry (pushed when the first sheet
 * opens, popped a tick after the last one closes). Closing sheet A and opening
 * sheet B in the same moment therefore causes no history churn, which keeps fast
 * taps from racing with the browser's asynchronous history navigation.
 */
type Entry = { close: () => void };
const stack: Entry[] = [];
let hasEntry = false; // a history entry is currently reserved for the modal layer
let ignore = 0; // programmatic history.back() calls still to be reported by popstate
let timer: ReturnType<typeof setTimeout> | null = null;
let installed = false;
const waiting: (() => void)[] = [];

function release() {
  if (ignore === 0) waiting.splice(0).forEach((fn) => fn());
}

function sync() {
  timer = null;
  if (stack.length === 0 && hasEntry) {
    hasEntry = false;
    ignore++;
    history.back();
  }
}

function install() {
  if (installed) return;
  installed = true;
  window.addEventListener('popstate', () => {
    if (ignore > 0) { ignore--; release(); return; }
    if (!hasEntry) return; // ordinary navigation, nothing to do with sheets
    // The user pressed Back: the reserved entry is gone. Close the top sheet.
    hasEntry = false;
    const top = stack.pop();
    top?.close();
    if (stack.length > 0) { history.pushState({ modal: true }, ''); hasEntry = true; }
  });
}

/** Returns an unregister function. Call it when the sheet unmounts. */
export function pushModal(close: () => void): () => void {
  install();
  const e: Entry = { close };
  stack.push(e);
  if (!hasEntry) { history.pushState({ modal: true }, ''); hasEntry = true; }
  return () => {
    const i = stack.indexOf(e);
    if (i >= 0) stack.splice(i, 1);
    if (stack.length === 0 && hasEntry && !timer) timer = setTimeout(sync, 0);
  };
}
export const hasOpenModal = () => stack.length > 0;

/** Run `fn` once any pending history step from closing a sheet has finished, so navigation isn't undone by it. */
export function afterHistorySettled(fn: () => void): void {
  if (timer) { clearTimeout(timer); sync(); }
  if (ignore > 0) {
    waiting.push(fn);
    // safety net: never wait forever if the browser drops the popstate
    setTimeout(() => { const i = waiting.indexOf(fn); if (i >= 0) { waiting.splice(i, 1); ignore = 0; fn(); } }, 600);
  } else fn();
}
