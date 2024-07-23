export type EasingFunction = (t: number) => number;

export type EasingUtil = {
  linear: EasingFunction;
  easeOutCubic: EasingFunction;
  easeInQuad: EasingFunction;
  easeOutQuad: EasingFunction;
  easeInOutQuad: EasingFunction;
  easeOutSine: EasingFunction;
  easeInOutSine: EasingFunction;
  easeInOutQuart: EasingFunction;
  easeInOutQuint: EasingFunction;
  easeOutExpo: EasingFunction;
};

export type Middleware = (currentValue: number | string) => number | string;

export type NumericalAnimatorCoreOptions = {
  start: number;
  end: number;
  duration: number;
  easingFunction?: EasingFunction | keyof EasingUtil;
  decimalPlaces?: number;
  autoPlay?: boolean;
  middleware?: Middleware[];
  onChange?: (value: number | string) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onReset?: () => void;
  onPause?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
};

export type RequiredNumericalAnimatorCoreOptions =
  Required<NumericalAnimatorCoreOptions> & {
    easingFunction: EasingFunction;
  };

export type TimeTrackingMethods = {
  getIsPaused: () => boolean;
  getElapsedTime: () => number;
  getCurrentTime: () => number;
  setCurrentTime: (value: number) => void;
};

export type TypeConstructor =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | FunctionConstructor
  | ArrayConstructor;

export type TypeScheme = {
  type: TypeConstructor | TypeConstructor[];
  isRequired: boolean;
  default: any;
};

export interface ErrorList {
  set errors(error: Error | null);
  get errors(): Error[];
}

export type AnimationFrameOptions = {
  start: number;
  end: number;
  duration: number;
  easingFunction: EasingFunction;
  decimalPlaces: number;
  startTimestamp: number;
  fetchTimeTrackingMethodsCallback: () => TimeTrackingMethods; //// isPaused, currentTime, elapsedTime, animationFrame
  onAnimatedValueChange: (currentValue: number) => void;
  onAnimationComplete: () => void;
};

export type AnimationFrameUpdatedOptions = {
  end: number;
  duration: number;
  easingFunction: EasingFunction;
  decimalPlaces: number;
};

type NumericalAnimatorCoreEvents =
  | "change"
  | "complete"
  | "play"
  | "pause"
  | "reset"
  | "update"
  | "stop";

export type NumericalAnimatorEvents = NumericalAnimatorCoreEvents;

export type Listener<T = any> = (...args: T[]) => void;
