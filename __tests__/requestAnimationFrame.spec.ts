import AnimationFrame from "../src/core/animationFrame";
import RequestAnimationFrame from "../src/core/requestAnimationFrame";
import {
  requestAnimationFrame,
  cancelAnimationFrame,
} from "../src/utils/polyfills";

// Mock the polyfill functions
jest.mock("../src/utils/polyfills", () => ({
  requestAnimationFrame: jest.fn((callback) => setTimeout(callback, 16)),
  cancelAnimationFrame: jest.fn((id) => clearTimeout(id)),
}));

// Mock easing function for AnimationFrame
const mockEasingFunction = jest.fn((t) => t);

// Mock callback functions for AnimationFrame
const mockOnAnimatedValueChange = jest.fn();
const mockOnAnimationComplete = jest.fn();
const mockFetchTimeTrackingMethodsCallback = jest.fn(() => ({
  getIsPaused: jest.fn(),
  getElapsedTime: jest.fn(),
  getCurrentTime: jest.fn(),
  setCurrentTime: jest.fn(),
}));

// Default options for AnimationFrame
const defaultAnimationOptions = {
  start: 0,
  end: 100,
  duration: 1000,
  easingFunction: mockEasingFunction,
  decimalPlaces: 2,
  startTimestamp: 0,
  fetchTimeTrackingMethodsCallback: mockFetchTimeTrackingMethodsCallback,
  onAnimatedValueChange: mockOnAnimatedValueChange,
  onAnimationComplete: mockOnAnimationComplete,
};

describe("RequestAnimationFrame", () => {
  let rAF: RequestAnimationFrame;

  beforeEach(() => {
    jest.clearAllMocks();
    rAF = new RequestAnimationFrame();
  });

  it("should be a singleton", () => {
    const rAF2 = new RequestAnimationFrame();
    expect(rAF).toBe(rAF2);
  });

  it("should enqueue an animation frame and run the animation frame", () => {
    const animationFrame = new AnimationFrame(defaultAnimationOptions);

    rAF.enqueueFrameAndRunAnimationFrame(animationFrame);
    expect(rAF.queueSize()).toBe(1);
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it("should remove an animation frame from the queue", () => {
    (rAF as any)._animationFrameQueue = [];

    const animationFrame = new AnimationFrame(defaultAnimationOptions);

    rAF.enqueueFrameAndRunAnimationFrame(animationFrame);
    expect(rAF.queueSize()).toBe(1);

    rAF.removeFromQueue(animationFrame.id, jest.fn());
    expect(rAF.queueSize()).toBe(0);
  });

  it("should throw an error if trying to remove a non-existing animation frame", () => {
    expect(() => rAF.removeFromQueue(888, jest.fn())).toThrow(
      "Cannot remove animationFrame: frame with id 888 does not exist."
    );
  });

  it("should cancel animation if queue is empty", () => {
    (rAF as any)._animationFrameQueue = [];

    const result = rAF.cancelAnimationIfQueueEmpty();
    expect(result).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("should not cancel animation if queue is not empty", () => {
    const animationFrame = new AnimationFrame(defaultAnimationOptions);
    rAF.enqueueFrameAndRunAnimationFrame(animationFrame);

    const result = rAF.cancelAnimationIfQueueEmpty();
    expect(result).toBe(false);
    expect(cancelAnimationFrame).not.toHaveBeenCalled();
  });

  it("should increase, decrease and reset paused counter correctly", () => {
    rAF.increasePausedCounter();
    expect(rAF.getPausedCounter()).toBe(1);

    rAF.decreasePausedCounter();
    expect(rAF.getPausedCounter()).toBe(0);

    rAF.increasePausedCounter();
    rAF.increasePausedCounter();
    expect(rAF.getPausedCounter()).toBe(2);

    rAF.resetPausedCounter();
    expect(rAF.getPausedCounter()).toBe(0);
  });

  it("should return the current frame id", () => {
    rAF.runAnimationFrame();
    expect(rAF.getFrameId()).not.toBeNull();
  });

  it("should reset the frame id", () => {
    rAF.runAnimationFrame();
    rAF.resetFrameId();
    expect(rAF.getFrameId()).toBeNull();
  });
});
