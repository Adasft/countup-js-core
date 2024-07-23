import {
  NumericalAnimatorCoreOptions,
  ErrorList,
  RequiredNumericalAnimatorCoreOptions,
  TypeConstructor,
  TypeScheme,
} from "../types/types";
import UtilityEasingFunctions from "./easingFunctions";
import { noop } from "./polyfills";

export default class TypeChecker implements ErrorList {
  private static _INSTANCE: TypeChecker;
  private _errors: TypeError[] = [];

  public set errors(error: TypeError | null) {
    if (!(error instanceof TypeError)) {
      return;
    }
    this._errors.push(error);
  }

  public get errors(): TypeError[] {
    const errors = [...this._errors];
    this._errors = [];
    return errors;
  }

  public readonly optionTypeScheme: {
    [option in keyof RequiredNumericalAnimatorCoreOptions]: TypeScheme;
  } = Object.freeze({
    start: this._createTypeScheme(Number, true, 0),
    end: this._createTypeScheme(Number, true, 0),
    duration: this._createTypeScheme(Number, true, 0),
    easingFunction: this._createTypeScheme(
      [String, Function],
      false,
      UtilityEasingFunctions.easeOutCubic
    ),
    decimalPlaces: this._createTypeScheme(Number, false, 0),
    autoPlay: this._createTypeScheme(Boolean, false, false),
    middleware: this._createTypeScheme(Array, false, []),
    onChange: this._createTypeScheme(Function, false, noop),
    onComplete: this._createTypeScheme(Function, false, noop),
    onPlay: this._createTypeScheme(Function, false, noop),
    onPause: this._createTypeScheme(Function, false, noop),
    onUpdate: this._createTypeScheme(Function, false, noop),
    onReset: this._createTypeScheme(Function, false, noop),
    onStop: this._createTypeScheme(Function, false, noop),
  });

  constructor() {
    if (!TypeChecker._INSTANCE) {
      TypeChecker._INSTANCE = this;
    }

    return TypeChecker._INSTANCE;
  }

  private _createTypeScheme(
    type: TypeConstructor | TypeConstructor[],
    isRequired: boolean,
    defaultVal: any
  ): TypeScheme {
    return Object.freeze({ type, isRequired, default: defaultVal });
  }

  private _createTypeError(
    option: string,
    receivedValue: any,
    type: TypeConstructor | TypeConstructor[]
  ): Error {
    const typeName = (
      Array.isArray(type) ? type.map((t) => t.name).join(" | ") : type.name
    ).toLowerCase();
    return new TypeError(
      `Invalid assignment for type '${typeName}' in option '${option}'. Expected a valid ${typeName.replace(
        "|",
        "or"
      )}, but received '${receivedValue}' (${typeof receivedValue}).`
    );
  }

  private _checkType(
    option: keyof NumericalAnimatorCoreOptions,
    receivedValue: any,
    type: TypeConstructor | TypeConstructor[]
  ): TypeError | null {
    const isOrType = Array.isArray(type);

    if (receivedValue === null) {
      return new TypeError(
        `The value of '${option}' cannot be null. Please provide a valid value.`
      );
    }

    if (
      receivedValue !== undefined &&
      ((isOrType && type.every((t) => t !== receivedValue.constructor)) ||
        (!isOrType && type !== receivedValue.constructor))
    ) {
      return this._createTypeError(option, receivedValue, type);
    }

    return null;
  }

  private _assert(
    option: keyof NumericalAnimatorCoreOptions,
    receivedValue: any
  ): TypeError | null {
    const typeScheme = this.optionTypeScheme[option];
    const { type, isRequired } = typeScheme;

    if (isRequired && receivedValue === undefined) {
      this.errors = new TypeError(`The option '${option}' is required.`);
    }

    return this._checkType(option, receivedValue, type);
  }

  public default<T extends keyof NumericalAnimatorCoreOptions>(
    option: T
  ): RequiredNumericalAnimatorCoreOptions[T] {
    return this.optionTypeScheme[option].default;
  }

  public assert(
    option: keyof NumericalAnimatorCoreOptions,
    receivedValue: any
  ) {
    this.errors = this._assert(option, receivedValue);
  }

  public optional(
    option: keyof NumericalAnimatorCoreOptions,
    receivedValue: any
  ) {
    const typeScheme = this.optionTypeScheme[option];
    const { type } = typeScheme;
    this.errors = this._checkType(option, receivedValue, type);
  }

  public check(options: NumericalAnimatorCoreOptions) {
    const keyOptions = Object.keys(
      this.optionTypeScheme
    ) as (keyof NumericalAnimatorCoreOptions)[];
    for (const option of keyOptions) {
      const value = options[option];
      this.errors = this._assert(option, value);
    }
  }
}
