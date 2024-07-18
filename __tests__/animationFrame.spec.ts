import AnimationFrame, {
  AnimationFrameOptions,
} from "../src/core/animationFrame";
import { TimeTrackingMethods } from "../src/core/animatorCore";
import { EasingFunction } from "../src/utils/easingFunctions";

// Mock easing function
const mockEasingFunction: EasingFunction = jest.fn((t) => t);

// Mock callbacks
const mockOnAnimatedValueChange = jest.fn();
const mockOnAnimationComplete = jest.fn();
const mockFetchTimeTrackingMethodsCallback = jest.fn(
  (): TimeTrackingMethods => ({
    getIsPaused: jest.fn(() => false),
    getElapsedTime: jest.fn(() => 0),
    getCurrentTime: jest.fn(() => Date.now()),
    setCurrentTime: jest.fn((value: number) => {}),
  })
);

// Default options
const defaultOptions: AnimationFrameOptions = {
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

describe("AnimationFrame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with the correct values", () => {
    const animationFrame = new AnimationFrame(defaultOptions);
    expect(animationFrame.id).toBe(0);
    expect(animationFrame).toHaveProperty("_options", defaultOptions);
    expect(animationFrame).toHaveProperty("_factor", 100);
  });

  it("should calculate animated value correctly", () => {
    const animationFrame = new AnimationFrame(defaultOptions);
    const [progress, currentValue] = animationFrame["_calculateAnimatedValue"](
      500,
      0,
      100,
      1000,
      mockEasingFunction
    );

    expect(progress).toBe(0.5);
    expect(currentValue).toBe(50);
    expect(mockEasingFunction).toHaveBeenCalledWith(0.5);
  });

  it("should call onAnimatedValueChange and onAnimationComplete correctly", () => {
    const animationFrame = new AnimationFrame(defaultOptions);
    animationFrame.run(500);

    expect(mockOnAnimatedValueChange).toHaveBeenCalledWith(50);
    expect(mockOnAnimationComplete).not.toHaveBeenCalled();

    animationFrame.run(1000);

    expect(mockOnAnimatedValueChange).toHaveBeenCalledWith(100);
    expect(mockOnAnimationComplete).toHaveBeenCalledWith(animationFrame.id);
  });

  it("should update options correctly and run animation", () => {
    const animationFrame = new AnimationFrame(defaultOptions);
    const newOptions = { end: 200, duration: 5 };
    animationFrame.update(newOptions, 500);

    expect(animationFrame["_options"].end).toBe(200);
    expect(animationFrame["_options"].duration).toBe(5);
    expect(mockOnAnimatedValueChange).toHaveBeenCalledWith(50);
  });

  it("should fetch time tracking data correctly", () => {
    const animationFrame = new AnimationFrame(defaultOptions);
    const timeTrackingData = animationFrame.fetchTimeTrackingMethods();

    expect(timeTrackingData).toEqual({
      getIsPaused: expect.any(Function),
      getElapsedTime: expect.any(Function),
      getCurrentTime: expect.any(Function),
      setCurrentTime: expect.any(Function),
    });
    expect(mockFetchTimeTrackingMethodsCallback).toHaveBeenCalled();
  });
});
