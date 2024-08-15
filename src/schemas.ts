import { Type } from "./utils/typeChecking";

export namespace Schemas {
  export const middlewareSchema = Type.func(
    [Type.oneOfType([Type.number(true), Type.string(true)])],
    Type.oneOfType([Type.number(true), Type.string(true)]),
    true
  );

  export const easingFunctionNameSchema = Type.enumeration([
    "linear",
    "easeOutCubic",
    "easeInQuad",
    "easeOutQuad",
    "easeInOutQuad",
    "easeOutSine",
    "easeInOutSine",
    "easeInOutQuart",
    "easeInOutQuint",
    "easeOutExpo",
  ]);

  export const easingFunctionHandlerSchema = Type.func(
    [Type.number(true)],
    Type.number(true),
    true
  );

  export const easingFunctionSchema = Type.oneOfType([
    easingFunctionNameSchema,
    easingFunctionHandlerSchema,
  ]);

  export const optionsSchema = Type.object(
    {
      start: Type.number(true),
      end: Type.number(true),
      duration: Type.number(true),
      abortOnError: Type.boolean(),
      debug: Type.boolean(),
      easingFunction: Type.optional(easingFunctionSchema),
      decimalPlaces: Type.number(),
      autoPlay: Type.boolean(),
      middleware: Type.array([middlewareSchema]),
      onChange: Type.func(
        [Type.oneOfType([Type.number(true), Type.string(true)])],
        undefined
      ),
      onComplete: Type.func([], undefined),
      onPlay: Type.func([], undefined),
      onPause: Type.func([], undefined),
      onReset: Type.func([], undefined),
      onUpdate: Type.func([], undefined),
      onStop: Type.func([], undefined),
      onError: Type.func([Type.string(true)], undefined),
    },
    true
  );

  export const updatedOptionsSchema = Type.object(
    {
      end: Type.number(),
      duration: Type.number(),
      decimalPlaces: Type.number(),
      easingFunction: Type.optional(easingFunctionHandlerSchema),
    },
    true
  );

  export const modifiedValueSchema = Type.oneOfType([
    Type.number(true),
    Type.string(true),
  ]);
}
