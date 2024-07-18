import { EasingFunction } from "../utils/easingFunctions";
import { AnimationCommonOptions, TimeTrackingData } from "./animatorCore";

export type AnimationFrameOptions = Required<AnimationCommonOptions> & {
  startTimestamp: number;
  easingFunction: EasingFunction;
  fetchTimeTrackingDataCallback: () => TimeTrackingData; //// isPaused, currentTime, elapsedTime, animationFrame
  onAnimatedValueChange: (currentValue: number) => void;
  onAnimationComplete: (id: number) => void;
};

export type AnimationFrameUpdatedOptions = Partial<
  Omit<
    AnimationFrameOptions,
    "startValue" | "startTimestamp" | "onAnimatedValueChange" | "onAnimationEnd"
  >
>;

export default class AnimationFrame {
  public static currentAnimationFrameId: number = 0;

  private _options: AnimationFrameOptions;
  private _factor: number;

  public id: number;

  constructor(options: AnimationFrameOptions) {
    this._options = options;
    this.id = AnimationFrame.currentAnimationFrameId++;
    this._factor = Math.pow(10, this._options.decimalPlaces);
  }

  private _calculateAnimatedValue(
    elapsedTime: number,
    start: number,
    end: number,
    duration: number,
    easingFunction: EasingFunction
  ): [number, number] {
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = easingFunction(progress);
    const currentValue = start + (end - start) * easedProgress;
    const truncatedValue =
      Math.floor(currentValue * this._factor) / this._factor;

    return [easedProgress, truncatedValue];
  }

  public run(currentTime: number) {
    const elapsedTime = Math.max(currentTime - this._options.startTimestamp, 0);
    const [progress, currentValue] = this._calculateAnimatedValue(
      elapsedTime,
      this._options.start,
      this._options.end,
      this._options.duration,
      this._options.easingFunction
    );

    this._options.onAnimatedValueChange(currentValue);

    if (progress >= 1) {
      this._options.onAnimationComplete(this.id);
    }
  }

  public update(
    updatedOptions: AnimationFrameUpdatedOptions,
    currentTime: number
  ) {
    const oldEndValue = this._options.end;
    const oldDuration = this._options.duration;
    const elapsedTime = currentTime - this._options.startTimestamp;
    const [_, currentValue] = this._calculateAnimatedValue(
      elapsedTime,
      this._options.start,
      oldEndValue,
      oldDuration,
      this._options.easingFunction
    );

    this._options = {
      ...this._options,
      ...updatedOptions,
      start: currentValue, // Update the startValue to the current value
      startTimestamp: currentTime, // Reset the startTimestamp to the current time
    };

    this._factor = Math.pow(10, this._options.decimalPlaces);

    this.run(currentTime);
  }

  public fetchTimeTrackingData() {
    return this._options.fetchTimeTrackingDataCallback();
  }
}
