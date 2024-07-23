import AnimationFrame from "./animationFrame";
import UtilityEasingFunctions, {
  getEasingFunctionByName,
} from "../utils/easingFunctions";
import RequestAnimationFrame from "./requestAnimationFrame";
import TypeChecker from "../utils/typeChecking";
import {
  AnimationFrameUpdatedOptions,
  NumericalAnimatorCoreOptions,
  EasingFunction,
  EasingUtil,
  ErrorList,
  Middleware,
} from "../types/types";
import EventEmitter from "../events/eventsEmitter";

export default class NumericalAnimatorCore implements ErrorList {
  private static readonly DEFAULT_EASING_FUNCTION: EasingFunction =
    UtilityEasingFunctions.easeOutCubic;
  private static readonly MAX_DECIMAL_PLACES: number = 5;

  private readonly _typeChecker = new TypeChecker();
  private readonly _rAF: RequestAnimationFrame = new RequestAnimationFrame();
  private _interruptTimestamp: number = 0;
  private _animationFrame: AnimationFrame | null = null;
  private _isCountingStarted: boolean = false;
  private _currentTime: number = 0;
  private _elapsedTime: number = 0;

  private readonly _start: number;
  private _end: number;
  private _duration: number;
  private _easingFunction: EasingFunction;
  private _decimalPlaces: number;
  private _autoPlay: boolean;
  private readonly _middleware: Middleware[];
  private readonly _errors: Error[] = [];

  public set errors(error: Error | null) {
    if (!error) {
      return;
    }
    this._errors.push(error);
  }

  public get errors(): Error[] {
    return this._errors;
  }

  public readonly emitter = new EventEmitter();
  public isPaused: boolean = false;
  public readonly version = "1.0.0";

  constructor(options: NumericalAnimatorCoreOptions) {
    this._validateOptions(options);
    if (this.errors.length > 0) {
      throw new Error("Invalid options provided to NumericalAnimatorCore.");
    }

    const {
      start,
      end,
      duration,
      easingFunction,
      decimalPlaces,
      autoPlay,
      middleware,
      onChange,
      onComplete,
      onPlay,
      onPause,
      onReset,
      onUpdate,
      onStop,
    } = options;

    this._start = start;
    this._end = end;
    this._duration = duration;

    this._easingFunction = this._getEasingFunction(
      easingFunction ?? this._typeChecker.default("easingFunction")
    );
    this._decimalPlaces = Math.min(
      decimalPlaces ?? this._typeChecker.default("decimalPlaces"),
      NumericalAnimatorCore.MAX_DECIMAL_PLACES
    );
    this._autoPlay = autoPlay ?? this._typeChecker.default("autoPlay");
    this._middleware = [
      ...(middleware ?? this._typeChecker.default("middleware")),
    ];

    this.emitter.on("change", onChange);
    this.emitter.on("complete", onComplete);
    this.emitter.on("play", onPlay);
    this.emitter.on("pause", onPause);
    this.emitter.on("reset", onReset);
    this.emitter.on("update", onUpdate);
    this.emitter.on("stop", onStop);

    if (this._autoPlay) {
      this.play();
    } else {
      this._rAF.increasePausedCounter();
    }
  }

  private _validateOptions(options: NumericalAnimatorCoreOptions) {
    if (!options) {
      this.errors = new Error(
        "Invalid argument: 'options' cannot be undefined or null. Please provide a valid AnimatorCoreOptions object."
      );
      return;
    }

    this._typeChecker.check(options);

    const errors = this._typeChecker.errors;
    if (errors.length > 0) {
      this.errors.push(...errors);
      return;
    }
  }

  private _getEasingFunction(
    easingFunctionOrName: EasingFunction | keyof EasingUtil
  ) {
    if (typeof easingFunctionOrName === "function") {
      return easingFunctionOrName;
    }

    const easingFunction = getEasingFunctionByName(easingFunctionOrName);

    if (!easingFunction) {
      console.warn(
        `The easing function with name '${easingFunctionOrName}' does not exist.`
      );
    }

    return easingFunction ?? NumericalAnimatorCore.DEFAULT_EASING_FUNCTION;
  }

  private _stopAnimationFrame() {
    if (!this._animationFrame) {
      return;
    }

    const id = this._animationFrame.id;
    this._isCountingStarted = false;
    this._rAF.removeFromQueue(id, () => {
      this._animationFrame = null;
    });
  }

  private _resumeAnimationFrame() {
    this._elapsedTime += performance.now() - this._interruptTimestamp;
    this._rAF.decreasePausedCounter();
    this._rAF.runAnimationFrame();
  }

  private _startAnimationFrame() {
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
        this.emitter.emit("change", this.applyMiddleware(currentValue));
      },
      onAnimationComplete: () => {
        this._stopAnimationFrame();
        this.emitter.emit("complete");
      },
    });

    this._rAF.decreasePausedCounter();
    this._rAF.enqueueFrameAndRunAnimationFrame(this._animationFrame);

    this._elapsedTime = 0;
    this._currentTime = 0;
    this._interruptTimestamp = 0;
  }

  public applyMiddleware(value: number): number | string {
    let modifiedValue: number | string = value;
    if (this._middleware.length) {
      for (const middleware of this._middleware) {
        modifiedValue = middleware(modifiedValue);

        if (
          typeof modifiedValue !== "string" &&
          typeof modifiedValue !== "number"
        ) {
          this.errors = new Error(
            `The value returned by the middleware is invalid: '${middleware}'. It must be a number or a string.`
          );
          this.pause();
          return 0;
        }
      }
    }

    if (typeof modifiedValue === "number") {
      modifiedValue = Number(modifiedValue.toFixed(this._decimalPlaces));
    }

    return modifiedValue;
  }

  public play() {
    if (this._isCountingStarted) {
      return;
    }

    if (this.isPaused) {
      this._resumeAnimationFrame();
    } else {
      this._startAnimationFrame();
    }

    this.emitter.emit("play");
    this.isPaused = false;
    this._isCountingStarted = true;
  }

  public update(updatedOptions: AnimationFrameUpdatedOptions) {
    // Check if there is an animation frame before proceeding
    if (!this._animationFrame) {
      return;
    }

    const { end, duration, decimalPlaces, easingFunction } = updatedOptions;

    this._typeChecker.optional("end", end);
    this._typeChecker.optional("duration", duration);
    this._typeChecker.optional("decimalPlaces", decimalPlaces);
    this._typeChecker.optional("easingFunction", easingFunction);

    const errors = this._typeChecker.errors;
    if (errors.length > 0) {
      this.errors.push(...errors);
      return;
    }
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

    this.emitter.emit("update");
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

      this.emitter.emit("pause");
      this._interruptTimestamp = performance.now();
      this.isPaused = true;
      this._isCountingStarted = false;
    }
  }

  public reset() {
    this.emitter.emit("change", this.applyMiddleware(this._start));
    this.emitter.emit("reset");
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

  public stop() {
    this.emitter.emit("stop");
    this._stopAnimationFrame();
  }

  public addMiddleware(middleware: Middleware) {
    this._middleware.push(middleware);
  }
}
