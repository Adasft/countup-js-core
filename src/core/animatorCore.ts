import AnimationFrame, { AnimationFrameUpdatedOptions } from "./animationFrame";
import { cancelAnimationFrame, noop } from "../utils/polyfills";
import UtilityEasingFunctions, {
  EasingFunction,
  EasingUtil,
  getEasingFunctionByName,
} from "../utils/easingFunctions";
import RequestAnimationFrame from "./requestAnimationFrame";

export type AnimationCommonOptions = {
  start: number;
  end: number;
  duration: number;
  easingFunction?: EasingFunction | keyof EasingUtil;
  decimalPlaces?: number;
};

export type Middleware = (currentValue: number) => number | string;

export type AnimatorCoreOptions = AnimationCommonOptions & {
  autoPlay?: boolean;
  middleware?: Middleware[];
  onValueChange?: (value: number | string) => void;
  onComplete?: () => void;
  onPlay?: (error?: Error | null) => void;
  onReset?: () => void;
};

export type TimeTrackingData = {
  isPaused: boolean;
  elapsedTime: number;
  frameTime: number;
  currentTime: number;
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
  private _timeTrackingData: TimeTrackingData;

  public onValueChange: (value: number | string) => void;
  public onComplete: () => void;
  public onStart: (error?: Error | null) => void;
  public onReset: () => void;
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
    } = this._validateOptions(options);

    this._rAF = rAF;
    this._interruptTimestamp = 0;
    this._animationFrame = null;
    this._isCountingStarted = false;
    this._timeTrackingData = {
      isPaused: false,
      elapsedTime: 0,
      frameTime: 0,

      set currentTime(time: number) {
        this.frameTime = time;
      },

      get currentTime() {
        return this.frameTime;
      },
    };

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
    this.onValueChange = onValueChange ?? noop;
    this.onComplete = onComplete ?? noop;
    this.onStart = onPlay ?? noop;
    this.onReset = onReset ?? noop;

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

    if (
      typeof start !== "number" ||
      typeof end !== "number" ||
      typeof duration !== "number"
    ) {
      throw new Error(
        "Invalid options: 'start', 'end', and 'duration' must be numbers."
      );
    }

    if (
      easingFunction !== undefined &&
      typeof easingFunction !== "function" &&
      typeof easingFunction !== "string"
    ) {
      throw new Error(
        "Invalid options: 'easingFunction' must be a function or a string."
      );
    }

    if (decimalPlaces !== undefined && typeof decimalPlaces !== "number") {
      throw new Error("Invalid options: 'decimalPlaces' must be a number.");
    }

    if (autoPlay !== undefined && typeof autoPlay !== "boolean") {
      throw new Error("Invalid options: 'autoPlay' must be a boolean.");
    }

    if (middleware !== undefined && !Array.isArray(middleware)) {
      throw new Error(
        "Invalid options: 'middleware' must be an array of functions."
      );
    }

    if (middleware) {
      middleware.forEach((mw, index) => {
        if (typeof mw !== "function") {
          throw new Error(
            `Invalid middleware at index ${index}: must be a function.`
          );
        }
      });
    }

    if (onValueChange !== undefined && typeof onValueChange !== "function") {
      throw new Error("Invalid options: 'onValueChange' must be a function.");
    }

    if (onComplete !== undefined && typeof onComplete !== "function") {
      throw new Error("Invalid options: 'onComplete' must be a function.");
    }

    if (onPlay !== undefined && typeof onPlay !== "function") {
      throw new Error("Invalid options: 'onPlay' must be a function.");
    }

    if (onReset !== undefined && typeof onReset !== "function") {
      throw new Error("Invalid options: 'onReset' must be a function.");
    }

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

    this._animationFrame = new AnimationFrame({
      startTimestamp: performance.now(),
      start: this._start,
      end: this._end,
      duration: this._duration * 1000,
      easingFunction: this._easingFunction,
      decimalPlaces: this._decimalPlaces,
      fetchTimeTrackingDataCallback: () => {
        return this._timeTrackingData;
      },
      onAnimatedValueChange: (currentValue: number) => {
        let modifiedValue: number | string = currentValue;
        if (this._middleware.length) {
          for (const middleware of this._middleware) {
            modifiedValue = middleware(currentValue);
          }
        }
        this.onValueChange(modifiedValue);
      },
      onAnimationComplete: (id) => {
        this.onComplete();
        this._isCountingStarted = false;
        this._rAF.removeFromQueue(id, () => {
          this._animationFrame = null;
        });
      },
    });

    this._rAF.decreasePausedCounter();
    this._rAF.enqueueFrameAndRunAnimationFrame(this._animationFrame);

    if (callback) {
      this.onStart = callback;
    }

    this.onStart();
    this._timeTrackingData.isPaused = false;
    this._timeTrackingData.elapsedTime = 0;
    this._timeTrackingData.currentTime = 0;
    this._interruptTimestamp = 0;
    this._isCountingStarted = true;
  }

  public update(updatedOptions: AnimationFrameUpdatedOptions) {
    if (!this._animationFrame) {
      return;
    }

    this._end = updatedOptions.end ?? this._end;
    this._duration = updatedOptions.duration ?? this._duration;
    this._easingFunction =
      updatedOptions.easingFunction ?? this._easingFunction;
    this._decimalPlaces = updatedOptions.decimalPlaces ?? this._decimalPlaces;

    this._animationFrame.update(
      updatedOptions,
      this._timeTrackingData.currentTime
    );
  }

  public pause() {
    const frameId = this._rAF.getFrameId();
    if (!this._timeTrackingData.isPaused && frameId) {
      this._rAF.increasePausedCounter();

      if (this._rAF.getPausedCounter() >= this._rAF.queueSize()) {
        cancelAnimationFrame(frameId);
        this._rAF.resetFrameId();
      }

      this._interruptTimestamp = performance.now();
      this._timeTrackingData.isPaused = true;
    }
  }

  public resume() {
    if (this._timeTrackingData.isPaused) {
      this._timeTrackingData.isPaused = false;
      this._timeTrackingData.elapsedTime +=
        performance.now() - this._interruptTimestamp;
      this._rAF.decreasePausedCounter();
      this._rAF.runRequestAnimationFrame();
    }
  }

  public reset() {
    this.onReset();
    this._timeTrackingData.isPaused = false;
    this._timeTrackingData.elapsedTime = 0;
    this._timeTrackingData.currentTime = 0;
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

/* Methods
 * connect(callback?)
 * disconnect(callback?)
 * start(callback?) - init counter
 * pause() - pause counter
 * resume() - resume counter
 * reset() - reset counter
 * update() - update counter
 *
 * Props and options
 * id?: string
 * initialValue: number
 * targetValue: number
 * duration: number
 * fontVariantNumeric?: "normal" | "slashed-zero" | "tabular-nums" | "oldstyle-nums" = "tabular-nums"
 * enableScrollSpy?: boolean = false
 * onConnectedCallback?: () => void
 * onDisconnectedCallback?: () => void
 * onCompletedCallback?: () => void
 * onStartCallback?: () => void
 *
 * options
 * parent?: HTMLElement
 *
 * CountUp.define({
 *  hooks: {
 *    onConnected1(){}
 * }
 * })
 *
 * CountUp.create({ id: "my-count-1" })
 *
 *
 *
 */