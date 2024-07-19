class Checker {
  private _isRequired: boolean = false;

  constructor(
    private readonly _type: string[] | ((value: any) => boolean),
    private readonly _error: Error
  ) {}

  public assert(value: any) {
    if (value === undefined && !this._isRequired) {
      return;
    }

    if (
      (Array.isArray(this._type) && !this._type.includes(typeof value)) ||
      (!Array.isArray(this._type) &&
        typeof this._type === "function" &&
        !this._type(value))
    ) {
      console.error(this._error);
    }
    this._isRequired = false;
  }

  public required() {
    this._isRequired = true;
    return this;
  }
}

const requiredOptionsChecker = new Checker(
  ["number"],
  new Error("Invalid options: 'start', 'end', and 'duration' must be numbers.")
);

const createHookChecker = (hookName: string) =>
  new Checker(
    ["function"],
    new Error(`Invalid options: '${hookName}' must be a function.`)
  );

const TypeChecker = Object.freeze({
  start: requiredOptionsChecker,
  end: requiredOptionsChecker,
  duration: requiredOptionsChecker,
  easingFunction: new Checker(
    ["string", "function"],
    new Error(
      "Invalid options: 'easingFunction' must be a function or a string."
    )
  ),
  decimalPlaces: new Checker(
    ["number"],
    new Error("Invalid options: 'decimalPlaces' must be a number.")
  ),
  autoPlay: new Checker(
    ["boolean"],
    new Error("Invalid options: 'autoPlay' must be a boolean.")
  ),
  middleware: new Checker(
    (value) => Array.isArray(value),
    new Error("Invalid options: 'middleware' must be an array of functions.")
  ),
  onValueChange: createHookChecker("onValueChange"),
  onComplete: createHookChecker("onComplete"),
  onPlay: createHookChecker("onPlay"),
  onReset: createHookChecker("onReset"),
});

export default TypeChecker;
