// Importa la clase y las dependencias necesarias
// import jest, {describe} from "jest"
import AnimatorCore, { AnimatorCoreOptions } from "../src/core/animatorCore";
import RequestAnimationFrame from "../src/core/requestAnimationFrame";
import { EasingFunction } from "../src/utils/easingFunctions";

jest.mock("../src/core/requestAnimationFrame");

const defaultOptions: AnimatorCoreOptions = {
  start: 0,
  end: 100,
  duration: 10,
  onValueChange: jest.fn(),
  onComplete: jest.fn(),
};

describe("AnimatorCore", () => {
  let animator: any;
  let rAF: RequestAnimationFrame;

  beforeEach(() => {
    rAF = new RequestAnimationFrame();

    (rAF.getFrameId as jest.Mock).mockReturnValue(1);
    (rAF.increasePausedCounter as jest.Mock).mockImplementation(() => {});
    (rAF.getPausedCounter as jest.Mock).mockReturnValue(0);
    (rAF.queueSize as jest.Mock).mockReturnValue(1);
    (rAF.resetFrameId as jest.Mock).mockImplementation(() => {});
    (rAF.runRequestAnimationFrame as jest.Mock).mockImplementation(() => {});

    animator = new AnimatorCore(rAF, defaultOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct options", () => {
    expect(animator).toBeDefined();
    expect(animator.onValueChange).toBe(defaultOptions.onValueChange);
    expect(animator.onComplete).toBe(defaultOptions.onComplete);
  });

  it("should throw an error if rAF is not an instance of RequestAnimationFrame", () => {
    expect(() => {
      new AnimatorCore({} as RequestAnimationFrame, defaultOptions);
    }).toThrow(
      "Invalid argument: 'rAF' must be an instance of RequestAnimationFrame."
    );
  });

  it("should throw an error if options are invalid", () => {
    expect(() => {
      new AnimatorCore(rAF, {} as AnimatorCoreOptions);
    }).toThrow(
      "Invalid options: 'start', 'end', and 'duration' must be numbers."
    );
  });

  it("should correctly set easing function", () => {
    const easingFunction: EasingFunction = (t) => t * t;
    animator = new AnimatorCore(rAF, {
      start: 0,
      end: 100,
      duration: 5,
      easingFunction,
    });

    expect(animator._easingFunction).toBe(easingFunction);
  });

  it("should correctly update values", () => {
    animator = new AnimatorCore(rAF, {
      start: 0,
      end: 100,
      duration: 5,
    });

    animator.play();
    animator.pause();

    animator.update({ end: 200, duration: 10 });

    expect(animator._end).toBe(200);
    expect(animator._duration).toBe(10);
  });

  it("should handle middleware correctly", () => {
    const middleware = (value: number) => value * 2;
    animator = new AnimatorCore(rAF, {
      start: 0,
      end: 100,
      duration: 5,
    });

    animator.addMiddleware(middleware);

    // Simulate value change
    animator.onValueChange = jest.fn((value) => {
      expect(value).toBe(200); // Expect middleware to have doubled the value
    });

    animator.play();

    animator._animationFrame._options.onAnimatedValueChange(100);
    expect(animator.onValueChange).toHaveBeenCalledWith(200);
  });

  it("should call onComplete when animation is complete", () => {
    const onComplete = jest.fn();
    animator = new AnimatorCore(rAF, {
      start: 0,
      end: 100,
      duration: 5,
      autoPlay: true,
      onComplete,
    });

    // Simulate completion
    animator._animationFrame._options.onAnimationComplete(0);
    expect(onComplete).toHaveBeenCalled();
  });

  describe("play", () => {
    it("should start the animation", () => {
      animator.play();
      expect(rAF.enqueueFrameAndRunAnimationFrame).toHaveBeenCalled();
      expect(animator.isPaused).toBe(false);
    });

    it("should call onStart callback", () => {
      const onStart = jest.fn();
      animator.onStart = onStart;
      animator.play();
      expect(onStart).toHaveBeenCalled();
    });
  });

  describe("pause", () => {
    it("should pause the animation", () => {
      animator.play();
      animator.pause();
      expect(rAF.increasePausedCounter).toHaveBeenCalled();
      expect(animator.isPaused).toBe(true);
    });
  });

  describe("resume", () => {
    it("should resume the animation", () => {
      animator.play();
      animator.pause();
      animator.resume();
      expect(animator.isPaused).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset the animation", () => {
      animator.play();
      animator.reset();
      expect(animator.isPaused).toBe(false);
      expect(animator._isCountingStarted).toBe(false);
    });
  });

  describe("update", () => {
    it("should update the animation properties", () => {
      animator.play();
      const newOptions = {
        end: 200,
        duration: 20,
        easingFunction: jest.fn(),
      };
      animator.update(newOptions);
      expect(animator["_end"]).toBe(newOptions.end);
      expect(animator["_duration"]).toBe(newOptions.duration);
      expect(animator["_easingFunction"]).toBe(newOptions.easingFunction);
    });
  });
});
