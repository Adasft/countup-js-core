import { EasingFunction, UtilityEasingFunctions } from "../types";

const EasingUtils: UtilityEasingFunctions =
  Object.freeze<UtilityEasingFunctions>({
    linear: (t: number) => t,
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInQuad: (t: number) => t * t,
    easeOutQuad: (t: number) => t * (2 - t),
    easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
    easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInOutQuart: (t: number) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
    easeInOutQuint: (t: number) =>
      t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
    easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  });

export function getEasingFunctionByName(
  easeName: keyof UtilityEasingFunctions
): EasingFunction | undefined {
  return EasingUtils[easeName];
}

export default EasingUtils;
