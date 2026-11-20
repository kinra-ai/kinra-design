/** A selector for elements that take focus from the keyboard. */
export const focusable: string;
/**
 * Move focus without scrolling, unless the element has left the document or
 * now stands behind something inert. Returns whether focus moved.
 */
export function restore(element: Element | null | undefined): boolean;
