import AnimationFrame, { AnimationFrameUpdatedOptions } from "./animationFrame";
import { noop } from "../utils/polyfills";
import UtilityEasingFunctions, {
  EasingFunction,
  EasingUtil,
  getEasingFunctionByName,
} from "../utils/easingFunctions";
import RequestAnimationFrame from "./requestAnimationFrame";
import TypeChecker from "../utils/typeChecking";

export type AnimationCommonOptions = {
  start: number;
  end: number;
  duration: number;
  easingFunction?: EasingFunction | keyof EasingUtil;
  decimalPlaces?: number;
};

export type Middleware = (currentValue: number | string) => number | string;

export type AnimatorCoreOptions = AnimationCommonOptions & {
  autoPlay?: boolean;
  middleware?: Middleware[];
  onValueChange?: (value: number | string) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onReset?: () => void;
};

export type TimeTrackingMethods = {
  getIsPaused: () => boolean;
  getElapsedTime: () => number;
  getCurrentTime: () => number;
  setCurrentTime: (value: number) => void;
};

export default class AnimatorCore {
  private static readonly DEFAULT_EASING_FUNCTION: EasingFunction =
    UtilityEasingFunctions.easeOutCubic;
  private static readonly MAX_DECIMAL_PLACES: number = 5;

  private readonly _start: number;
  private _end: number;
  private _duration: number;
  private _easingFunction: EasingFunction;
  private _decimalPlaces: number;
  private readonly _middleware: Middleware[];
  private readonly _rAF: RequestAnimationFrame;
  private _interruptTimestamp: number;
  private _animationFrame: AnimationFrame | null;
  private _isCountingStarted: boolean;
  private _currentTime: number;
  private _elapsedTime: number;

  private readonly _onValueChange: (value: number | string) => void;
  private readonly _onComplete: () => void;
  private _onPlay: (callback?: () => void) => void;
  private _onReset: (callback?: () => void) => void;
  public isPaused: boolean = true;

  public readonly version = "1.0.0";

  constructor(rAF: RequestAnimationFrame, options: AnimatorCoreOptions) {
    if (!(rAF instanceof RequestAnimationFrame)) {
      throw new Error(
        "Invalid argument: 'rAF' must be an instance of RequestAnimationFrame."
      );
    }

    if (!options) {
      throw new Error(
        "Invalid argument: 'options' cannot be undefined or null. Please provide a valid AnimatorCoreOptions object."
      );
    }

    this._validateOptions(options);

    const {
      start,
      end,
      duration,
      easingFunction,
      decimalPlaces,
      autoPlay,
      middleware,
      onValueChange,
      onComplete,
      onPlay,
      onReset,
    } = options;

    this._rAF = rAF;
    this._interruptTimestamp = 0;
    this._animationFrame = null;
    this._isCountingStarted = false;
    this.isPaused = false;
    this._elapsedTime = 0;
    this._currentTime = 0;

    this._start = start;
    this._end = end;
    this._duration = duration;

    this._easingFunction = this._getEasingFunction(
      easingFunction ?? AnimatorCore.DEFAULT_EASING_FUNCTION
    );
    this._decimalPlaces = Math.min(
      decimalPlaces ?? 0,
      AnimatorCore.MAX_DECIMAL_PLACES
    );
    this._middleware = [...(middleware ?? [])];
    this._onValueChange = (value) => {
      const callback = onValueChange ?? noop;
      let modifiedValue: number | string = value;
      if (this._middleware.length) {
        for (const middleware of this._middleware) {
          modifiedValue = middleware(modifiedValue);

          if (
            typeof modifiedValue !== "string" &&
            typeof modifiedValue !== "number"
          ) {
            console.error(
              new Error(
                `The value returned by the middleware is invalid: '${middleware}'. It must be a number or a string.`
              )
            );
            this.pause();
            return;
          }
        }

        if (typeof modifiedValue === "number") {
          modifiedValue = modifiedValue.toFixed(this._decimalPlaces);
        }
      }
      callback(modifiedValue);
    };

    this._onComplete = () => {
      if (!this._animationFrame) {
        return;
      }

      const onCompleteCallback = onComplete ?? noop;
      const id = this._animationFrame.id;
      this._isCountingStarted = false;
      this._rAF.removeFromQueue(id, () => {
        this._animationFrame = null;
      });

      onCompleteCallback();
    };

    this._onPlay = onPlay ?? noop;
    this._onReset = onReset ?? noop;

    if (autoPlay) {
      this.play();
    } else {
      this._rAF.increasePausedCounter();
    }
  }

  private _validateOptions(options: AnimatorCoreOptions) {
    const {
      start,
      end,
      duration,
      easingFunction,
      decimalPlaces,
      autoPlay,
      middleware,
      onValueChange,
      onComplete,
      onPlay,
      onReset,
    } = options;

    TypeChecker.start.required().assert(start);
    TypeChecker.end.required().assert(end);
    TypeChecker.duration.required().assert(duration);

    TypeChecker.easingFunction.assert(easingFunction);
    TypeChecker.decimalPlaces.assert(decimalPlaces);
    TypeChecker.autoPlay.assert(autoPlay);
    TypeChecker.middleware.assert(middleware);

    TypeChecker.onValueChange.assert(onValueChange);
    TypeChecker.onComplete.assert(onComplete);
    TypeChecker.onPlay.assert(onPlay);
    TypeChecker.onReset.assert(onReset);

    return options;
  }

  private _getEasingFunction(
    easingFunctionOrName: EasingFunction | keyof EasingUtil
  ) {
    if (typeof easingFunctionOrName === "function") {
      return easingFunctionOrName;
    }

    const easingFunction = getEasingFunctionByName(easingFunctionOrName);
    if (!easingFunction) {
      throw new Error(
        `Easing function not found: '${easingFunctionOrName}'. Please ensure the name is correct and that the function is registered in EasingUtil.`
      );
    }

    return easingFunction;
  }

  public play(callback?: () => void) {
    if (this._isCountingStarted) {
      return;
    }

    if (this.isPaused) {
      this._elapsedTime += performance.now() - this._interruptTimestamp;
      this._rAF.decreasePausedCounter();
      this._rAF.runAnimationFrame();
    } else {
      this._animationFrame = new AnimationFrame({
        startTimestamp: performance.now(),
        start: this._start,
        end: this._end,
        duration: this._duration * 1000,
        easingFunction: this._easingFunction,
        decimalPlaces: this._decimalPlaces,
        fetchTimeTrackingMethodsCallback: () => {
          return {
            getIsPaused: () => this.isPaused,
            getElapsedTime: () => this._elapsedTime,
            getCurrentTime: () => this._currentTime,
            setCurrentTime: (value: number) => (this._currentTime = value),
          };
        },
        onAnimatedValueChange: (currentValue: number) => {
          this._onValueChange(currentValue);
        },
        onAnimationComplete: () => {
          this._onComplete();
        },
      });

      this._rAF.decreasePausedCounter();
      this._rAF.enqueueFrameAndRunAnimationFrame(this._animationFrame);

      this._elapsedTime = 0;
      this._currentTime = 0;
      this._interruptTimestamp = 0;
    }

    if (callback) {
      this._onPlay = callback;
    }

    this._onPlay();
    this.isPaused = false;
    this._isCountingStarted = true;
  }

  public update(updatedOptions: AnimationFrameUpdatedOptions) {
    // Check if there is an animation frame before proceeding
    if (!this._animationFrame) {
      return;
    }

    const { end, duration, decimalPlaces, easingFunction } = updatedOptions;

    TypeChecker.end.assert(end);
    TypeChecker.duration.assert(duration);
    TypeChecker.decimalPlaces.assert(decimalPlaces);
    TypeChecker.easingFunction.assert(easingFunction);
    // Update options with supplied values ​​or keep current ones
    this._end = end ?? this._end;
    this._decimalPlaces = decimalPlaces ?? this._decimalPlaces;

    // If a duration is given, update it and convert to milliseconds
    if (duration !== undefined) {
      this._duration = duration;
      updatedOptions.duration = duration * 1000;
    }

    if (updatedOptions.easingFunction) {
      this._easingFunction = updatedOptions.easingFunction =
        this._getEasingFunction(easingFunction);
    }

    // Update the animation frame with the changed options
    this._animationFrame.update(updatedOptions, this._currentTime);
  }

  public pause() {
    const frameId = this._rAF.getFrameId();
    if (!this.isPaused && frameId) {
      this._rAF.increasePausedCounter();

      if (this._rAF.getPausedCounter() >= this._rAF.queueSize()) {
        this._rAF.cancelAnimationFrame();
      }

      this._interruptTimestamp = performance.now();
      this.isPaused = true;
      this._isCountingStarted = false;
    }
  }

  public reset(callback?: () => void) {
    if (callback) {
      this._onReset = callback;
    }

    this._onValueChange(this._start);
    this._onReset();
    this.isPaused = false;
    this._elapsedTime = 0;
    this._currentTime = 0;
    this._interruptTimestamp = 0;
    this._isCountingStarted = false;

    if (this._animationFrame) {
      this._rAF.removeFromQueue(this._animationFrame.id, () => {
        this._animationFrame = null;
      });
    }

    this._rAF.resetPausedCounter();
    this._rAF.cancelAnimationIfQueueEmpty();
  }

  public addMiddleware(middleware: Middleware) {
    this._middleware.push(middleware);
  }
}
