import TypeChecker, { InferType } from "./utils/typeChecking";

export const optionsSchema = TypeChecker.object({
  start: TypeChecker.number(true),
  end: TypeChecker.number(true),
  duration: TypeChecker.number(true),
  easingFunction: TypeChecker.oneOfType([
    TypeChecker.string(),
    TypeChecker.func(),
  ]),
  decimalPlaces: TypeChecker.number(),
  autoPlay: TypeChecker.boolean(),
  middleware: TypeChecker.array([
    TypeChecker.func(
      [TypeChecker.number(), TypeChecker.string()],
      TypeChecker.number(),
      true
    ),
  ]),
  onChange: TypeChecker.func(),
  onComplete: TypeChecker.func(),
  onPlay: TypeChecker.func(),
  onPause: TypeChecker.func(),
  onReset: TypeChecker.func(),
  onUpdate: TypeChecker.func(),
  onStop: TypeChecker.func(),
});

const fnSchema = TypeChecker.func(
  [TypeChecker.number(true), TypeChecker.string(true)],
  TypeChecker.number()
);

type fnT = InferType<typeof fnSchema>;

export const updatedOptionsSchema = TypeChecker.object({
  end: TypeChecker.number(),
  duration: TypeChecker.number(),
  decimalPlaces: TypeChecker.number(),
  easingFunction: TypeChecker.oneOfType([
    TypeChecker.string(),
    TypeChecker.func(),
  ]),
});

export const modifiedValueSchema = TypeChecker.oneOfType([
  TypeChecker.number(),
  TypeChecker.string(),
]);
