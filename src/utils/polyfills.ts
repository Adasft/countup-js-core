export const noop = () => {};

export function requestAnimationFrame(callback: FrameRequestCallback): number {
  if (!window.requestAnimationFrame) {
    let lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const handle = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return handle;
    };
  }

  return window.requestAnimationFrame(callback);
}

export function cancelAnimationFrame(handle: number) {
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (handle) {
      clearTimeout(handle);
    };
  }

  window.cancelAnimationFrame(handle);
}
