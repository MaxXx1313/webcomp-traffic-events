// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 */
export function watchElementSize(element: HTMLElement, cb: () => void): ResizeObserver | null {
  if (typeof window.ResizeObserver === 'function') {

    const sizeObserver = new ResizeObserver(() => {
      cb();
    });
    sizeObserver.observe(element);

    return sizeObserver
  } else {
    console.warn('ResizeObserver is not supported');
    return null;
  }
}
