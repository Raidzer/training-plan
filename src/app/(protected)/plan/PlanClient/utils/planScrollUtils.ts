const MAX_SMOOTH_SCROLL_ATTEMPTS = 2;
const SCROLL_END_TIMEOUT_MS = 2000;
const SCROLL_SETTLE_DELAY_MS = 120;
const VIEWPORT_PADDING_PX = 16;

function isElementFullyVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportTop = VIEWPORT_PADDING_PX;
  const viewportBottom = viewportHeight - VIEWPORT_PADDING_PX;
  const availableHeight = viewportBottom - viewportTop;

  if (rect.height > availableHeight) {
    return rect.top <= viewportTop && rect.bottom >= viewportBottom;
  }

  return rect.top >= viewportTop && rect.bottom <= viewportBottom;
}

export function scrollPlanEntryIntoView(target: HTMLElement, onComplete: () => void) {
  let cancelled = false;
  let scrollEndTimeoutId: number | null = null;
  let scrollSettleTimeoutId: number | null = null;
  let smoothScrollAttempts = 0;
  const supportsScrollEnd = "onscrollend" in window;

  const clearTimeouts = () => {
    if (scrollEndTimeoutId !== null) {
      window.clearTimeout(scrollEndTimeoutId);
      scrollEndTimeoutId = null;
    }

    if (scrollSettleTimeoutId !== null) {
      window.clearTimeout(scrollSettleTimeoutId);
      scrollSettleTimeoutId = null;
    }
  };

  const handleFallbackScroll = () => {
    if (scrollSettleTimeoutId !== null) {
      window.clearTimeout(scrollSettleTimeoutId);
    }

    scrollSettleTimeoutId = window.setTimeout(handleScrollSettled, SCROLL_SETTLE_DELAY_MS);
  };

  const stopWaitingForScroll = () => {
    clearTimeouts();
    document.removeEventListener("scrollend", handleScrollSettled);
    document.removeEventListener("scroll", handleFallbackScroll);
  };

  const finish = () => {
    stopWaitingForScroll();
    if (!cancelled) {
      onComplete();
    }
  };

  const waitForScrollEnd = () => {
    if (supportsScrollEnd) {
      document.addEventListener("scrollend", handleScrollSettled, { once: true });
      scrollEndTimeoutId = window.setTimeout(handleScrollSettled, SCROLL_END_TIMEOUT_MS);
      return;
    }

    document.addEventListener("scroll", handleFallbackScroll, { passive: true });
    scrollSettleTimeoutId = window.setTimeout(handleScrollSettled, SCROLL_SETTLE_DELAY_MS);
  };

  const startSmoothScroll = () => {
    smoothScrollAttempts += 1;
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    waitForScrollEnd();
  };

  function handleScrollSettled() {
    stopWaitingForScroll();

    if (cancelled || !target.isConnected) {
      return;
    }

    if (isElementFullyVisible(target)) {
      finish();
      return;
    }

    if (smoothScrollAttempts < MAX_SMOOTH_SCROLL_ATTEMPTS) {
      startSmoothScroll();
      return;
    }

    target.scrollIntoView({ block: "center", behavior: "instant" });
    finish();
  }

  if (isElementFullyVisible(target)) {
    onComplete();
    return () => {};
  }

  startSmoothScroll();

  return () => {
    cancelled = true;
    stopWaitingForScroll();
  };
}
