import { Type } from "./utils/typeChecking";
import { Schemas } from "./schemas";

export type EasingFunction = Type.Infer<
  typeof Schemas.easingFunctionHandlerSchema
>;

export type UtilityEasingFunctions = {
  [key in Type.Infer<typeof Schemas.easingFunctionNameSchema>]: EasingFunction;
};

export type Middleware = Type.Infer<typeof Schemas.middlewareSchema>;

export type NumericalAnimatorCoreOptions = Type.Infer<
  typeof Schemas.optionsSchema
>;

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
  | ArrayConstructor
  | ObjectConstructor;

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

export type AnimationFrameUpdatedOptions = Type.Infer<
  typeof Schemas.updatedOptionsSchema
>;

export type NumericalAnimatorEvents =
  | "change"
  | "complete"
  | "play"
  | "pause"
  | "reset"
  | "update"
  | "stop"
  | "error";

export type Listener<T = any> = (...args: T[]) => void;
