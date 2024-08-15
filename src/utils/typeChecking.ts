import { TypeConstructor } from "../types";

export namespace Type {
  type Flatten<T> = { [K in keyof T]: T[K] };
  type ObjectSchemaKeys = { [key: string]: TypeValidatorSchema<any> };
  type ObjectOptionalSchemaKeys<T extends ObjectSchemaKeys> = {
    [K in keyof T]: undefined extends T[K]["_type"] ? K : never;
  }[keyof T];
  type ObjectRequiredSchemaKeys<T extends ObjectSchemaKeys> = {
    [K in keyof T]: undefined extends T[K]["_type"] ? never : K;
  }[keyof T];
  type ObjectSchema<T extends ObjectSchemaKeys | undefined> =
    T extends ObjectSchemaKeys
      ? Flatten<
          {
            [K in ObjectRequiredSchemaKeys<T>]: T[K]["_type"];
          } & {
            [K in ObjectOptionalSchemaKeys<T>]?: T[K]["_type"];
          }
        >
      : undefined;

  type ArraySchemaKeys = Array<TypeValidatorSchema<any>>;
  type ArraySchema<T extends ArraySchemaKeys | undefined> =
    T extends ArraySchemaKeys
      ? {
          [K in keyof T]: T[K] extends TypeValidatorSchema<any>
            ? T[K]["_type"]
            : never;
        }
      : undefined;

  export type Infer<T extends TypeValidatorSchema<any>> = T["_type"];
  export type KeyOf<T> = T extends { [key: string]: any } ? keyof T : never;

  export type ValidationErrorMessage = {
    requiredError?: string;
    typeError?: string;
    nullishError?: string;
  };

  export type ValidationError = keyof ValidationErrorMessage;

  function getTypeName(type: TypeConstructor | TypeConstructor[]): string {
    return (
      Array.isArray(type) ? type.map((t) => t.name).join(" | ") : type.name
    ).toLowerCase();
  }

  function getRecievedTypeName(receivedValue: any): string {
    return Array.isArray(receivedValue) ? "array" : typeof receivedValue;
  }

  export class TypeValidationError extends Error {
    public name: string;

    private constructor(
      public message: string,
      public errorType: ValidationError,
      public type: TypeConstructor | TypeConstructor[]
    ) {
      super(message);
      this.name = "TypeError";
    }

    static createRequiredError(
      message: string,
      type: TypeConstructor | TypeConstructor[]
    ): TypeValidationError {
      return new TypeValidationError(message, "requiredError", type);
    }

    static createNullishError(
      message: string,
      type: TypeConstructor | TypeConstructor[]
    ): TypeValidationError {
      return new TypeValidationError(message, "nullishError", type);
    }

    static createTypeError(
      message: string,
      type: TypeConstructor | TypeConstructor[]
    ): TypeValidationError {
      return new TypeValidationError(message, "typeError", type);
    }
  }

  export class TypeValidatorSchema<T> {
    public readonly _type!: T;

    constructor(
      public type: TypeConstructor | TypeConstructor[],
      public isRequired: boolean
    ) {}

    static getRequiredError(type: TypeConstructor | TypeConstructor[]): string {
      return `A value of type '${getTypeName(
        type
      )}' is required but none was provided.`;
    }

    static getNullishError(type: TypeConstructor | TypeConstructor[]): string {
      return `The value of type '${getTypeName(
        type
      )}' cannot be null or undefined.`;
    }

    static getTypeError(
      type: TypeConstructor | TypeConstructor[],
      receivedValue: any
    ): string {
      return `Expected value of type '${getTypeName(
        type
      )}', but received value of type '${typeof receivedValue}'.`;
    }

    static assertType(
      type: TypeConstructor | TypeConstructor[],
      receivedValue: any,
      isRequired: boolean,
      errors: Required<ValidationErrorMessage>
    ): TypeValidationError | undefined {
      const isOrType = Array.isArray(type);

      if (isRequired && receivedValue === undefined) {
        return TypeValidationError.createRequiredError(
          errors.requiredError,
          type
        );
      }

      if (receivedValue === null) {
        return TypeValidationError.createNullishError(
          errors.nullishError,
          type
        );
      }

      if (
        receivedValue !== undefined &&
        ((isOrType && type.every((t) => t !== receivedValue.constructor)) ||
          (!isOrType && type !== receivedValue.constructor))
      ) {
        return TypeValidationError.createTypeError(errors.typeError, type);
      }
    }

    static getErrorsMessage(
      type: TypeConstructor | TypeConstructor[],
      receivedValue: any,
      errors?: ValidationErrorMessage
    ): Required<ValidationErrorMessage> {
      return {
        requiredError:
          errors?.requiredError ?? TypeValidatorSchema.getRequiredError(type),
        nullishError:
          errors?.nullishError ?? TypeValidatorSchema.getNullishError(type),
        typeError:
          errors?.typeError ??
          TypeValidatorSchema.getTypeError(type, receivedValue),
      };
    }

    public validate(receivedValue: any, errors?: ValidationErrorMessage) {
      const error = TypeValidatorSchema.assertType(
        this.type,
        receivedValue,
        this.isRequired,
        TypeValidatorSchema.getErrorsMessage(this.type, receivedValue, errors)
      );

      if (error) {
        throw error;
      }
    }

    public safeValidate(receivedValue: any, errors?: ValidationErrorMessage) {
      const typeName = getTypeName(this.type);
      try {
        this.validate(receivedValue, errors);
        return { ok: true, value: receivedValue, error: null, type: typeName };
      } catch (error: any) {
        return { ok: false, error, type: typeName };
      }
    }
  }

  export class ObjectValidatorSchema<
    T extends ObjectSchemaKeys | undefined
  > extends TypeValidatorSchema<ObjectSchema<T>> {
    constructor(private readonly _schema: T, isRequired: boolean) {
      super(Object, isRequired);
    }

    private _createTypeErrorMessage(
      key: string,
      receivedValue: any,
      type: TypeConstructor | TypeConstructor[]
    ): string {
      const expectedType = getTypeName(type);
      const receivedType = getRecievedTypeName(receivedValue);
      const receivedValueString =
        typeof receivedValue === "object"
          ? JSON.stringify(receivedValue)
          : receivedValue;
      return `Invalid assignment for type '${expectedType}' in key '${key}'. Expected a valid ${expectedType.replace(
        "|",
        "or"
      )}, but received '${receivedValueString}' (${receivedType}).`;
    }

    public override validate(
      receivedValue: any,
      errors?: ValidationErrorMessage
    ) {
      super.validate(receivedValue, errors);

      if (!receivedValue || !this._schema) {
        return;
      }

      for (const key in this._schema) {
        const value = receivedValue[key];
        const { error } = this._schema[key].safeValidate(value, {
          requiredError: `Key '${key}' is required`,
          nullishError: `Key '${key}' cannot be null`,
          typeError: this._createTypeErrorMessage(
            key,
            value,
            this._schema[key].type
          ),
        });

        if (error) {
          throw error;
        }

        if (!value || value.constructor !== Object) {
          continue;
        }
      }
    }
  }

  export class ArrayValidatorSchema<
    T extends ArraySchemaKeys | undefined
  > extends TypeValidatorSchema<ArraySchema<T>> {
    constructor(private readonly _schema: T, isRequired: boolean) {
      super(Array, isRequired);
    }

    private _createTypeErrorMessage(
      receivedValue: any,
      index: number,
      type: TypeConstructor[]
    ): string {
      const expectedType = getTypeName(type);
      const receivedType = getRecievedTypeName(receivedValue);
      const receivedValueString =
        typeof receivedValue === "object"
          ? JSON.stringify(receivedValue)
          : receivedValue;
      return `Invalid assignment for type '${expectedType}' at index ${index}. Expected a valid ${expectedType.replace(
        "|",
        "or"
      )}, but received '${receivedValueString}' (${receivedType}).`;
    }

    public override validate(
      receivedValue: any,
      errors?: ValidationErrorMessage
    ) {
      super.validate(receivedValue, errors);

      if (!receivedValue || !this._schema) {
        return;
      }

      const extractedType = this._schema.map((t) => t.type).flat();
      for (let i = 0; i < receivedValue.length; i++) {
        const item = receivedValue[i];
        for (const s of this._schema) {
          if (
            extractedType.includes(item?.constructor) &&
            s.type !== item?.constructor
          ) {
            continue;
          }

          const { error } = s.safeValidate(item, {
            typeError: this._createTypeErrorMessage(item, i, extractedType),
          });

          if (error) {
            throw error;
          }
        }
      }
    }
  }

  type TupleToFunction<
    A extends
      | [
          TypeValidatorSchema<any> | undefined,
          ...(TypeValidatorSchema<any>[] | undefined[])
        ]
      | [],
    R extends TypeValidatorSchema<any>
  > = A extends []
    ? () => R["_type"]
    : (
        ...args: {
          [K in keyof A]: A[K] extends TypeValidatorSchema<any>
            ? A[K]["_type"]
            : never;
        }
      ) => R["_type"];

  export class FunctionValidatorSchema<
    Args extends
      | [
          TypeValidatorSchema<any> | undefined,
          ...(TypeValidatorSchema<any>[] | undefined[])
        ]
      | [],
    Returns extends TypeValidatorSchema<any> | undefined,
    Required extends boolean = false
  > extends TypeValidatorSchema<
    Required extends true
      ? TupleToFunction<
          Args,
          Returns extends undefined ? TypeValidatorSchema<void> : Returns
        >
      :
          | TupleToFunction<
              Args,
              Returns extends undefined ? TypeValidatorSchema<void> : Returns
            >
          | undefined
  > {
    constructor(
      private readonly _schema: {
        args: Args | [];
        returns: Returns | undefined;
      },
      isRequired: boolean
    ) {
      super(Function, isRequired);
    }

    public apply(fn: Function, ...args: any[]) {
      if (!this._schema || !this._schema.args) {
        return;
      }

      if (this._schema.args.length !== args.length) {
        throw TypeValidationError.createTypeError(
          `Expected ${this._schema.args.length} arguments, but received ${args.length}.`,
          Function
        );
      }

      for (let i = 0; i < args.length; i++) {
        const arg = this._schema.args[i];
        if (!arg) {
          continue;
        }

        const { error } = arg.safeValidate(args[i], {
          typeError: `Expected argument of type '${getTypeName(
            arg.type
          )}', but received value of type '${typeof args[i]}'.`,
        });

        if (error) {
          throw error;
        }
      }

      const result = fn(...args);

      if (this._schema.returns) {
        this._schema.returns.validate(result);
      }
      return result;
    }

    public safeApply(fn: Function, ...args: any[]) {
      try {
        return this.apply(fn, ...args);
      } catch (error: any) {
        return error;
      }
    }
  }

  export class EnumValueValidatorSchema<
    T extends string
  > extends TypeValidatorSchema<T> {
    constructor(private readonly _schema: T[], isRequired: boolean) {
      super(String, isRequired);
    }

    public override validate(
      receivedValue: any,
      errors?: ValidationErrorMessage
    ) {
      super.validate(receivedValue, errors);

      if (!this._schema.includes(receivedValue)) {
        throw TypeValidationError.createTypeError(
          `Expected value to be one of '${this._schema.join(
            ", "
          )}', but received '${getRecievedTypeName(receivedValue)}'.`,
          String
        );
      }
    }
  }

  class TypeChecker {
    private constructor() {}

    private static _getValidatorForPrimitiveType<T>(
      type: TypeConstructor | TypeConstructor[],
      isRequired: boolean
    ): TypeValidatorSchema<T> {
      return new TypeValidatorSchema(type, isRequired);
    }

    public static object<T extends ObjectSchemaKeys>(
      schema: T,
      isRequired: true
    ): ObjectValidatorSchema<T>;
    public static object<T extends ObjectSchemaKeys>(
      schema: T,
      isRequired?: false
    ): ObjectValidatorSchema<T | undefined>;
    public static object<T extends ObjectSchemaKeys>(
      schema: T,
      isRequired = false
    ): ObjectValidatorSchema<T> {
      return new ObjectValidatorSchema(schema, isRequired);
    }

    public static array<T extends ArraySchemaKeys>(
      schema: T,
      isRequired: true
    ): ArrayValidatorSchema<T>;
    public static array<T extends ArraySchemaKeys>(
      schema: T,
      isRequired?: false
    ): ArrayValidatorSchema<T | undefined>;
    public static array<T extends ArraySchemaKeys>(
      schema: T,
      isRequired = false
    ): ArrayValidatorSchema<T | undefined> {
      return new ArrayValidatorSchema(schema, isRequired);
    }

    public static number(isRequired: true): TypeValidatorSchema<number>;
    public static number(
      isRequired?: false
    ): TypeValidatorSchema<number | undefined>;
    public static number(
      isRequired = false
    ): TypeValidatorSchema<number | undefined> {
      return TypeChecker._getValidatorForPrimitiveType(Number, isRequired);
    }

    public static string(isRequired: true): TypeValidatorSchema<string>;
    public static string(
      isRequired?: false
    ): TypeValidatorSchema<string | undefined>;
    public static string(
      isRequired = false
    ): TypeValidatorSchema<string | undefined> {
      return TypeChecker._getValidatorForPrimitiveType(String, isRequired);
    }

    public static boolean(isRequired: true): TypeValidatorSchema<boolean>;
    public static boolean(
      isRequired?: false
    ): TypeValidatorSchema<boolean | undefined>;
    public static boolean(
      isRequired = false
    ): TypeValidatorSchema<boolean | undefined> {
      return TypeChecker._getValidatorForPrimitiveType(Boolean, isRequired);
    }

    public static func<
      Args extends
        | [
            TypeValidatorSchema<any> | undefined,
            ...(TypeValidatorSchema<any>[] | undefined[])
          ]
        | [],
      Returns extends TypeValidatorSchema<any> | undefined
    >(
      args: Args,
      returns: Returns,
      isRequired: true
    ): FunctionValidatorSchema<Args, Returns, true>;
    public static func<
      Args extends
        | [
            TypeValidatorSchema<any> | undefined,
            ...(TypeValidatorSchema<any>[] | undefined[])
          ]
        | [],
      Returns extends TypeValidatorSchema<any> | undefined
    >(
      args: Args,
      returns: Returns,
      isRequired?: false
    ): FunctionValidatorSchema<Args, Returns>;
    public static func<
      Args extends
        | [
            TypeValidatorSchema<any> | undefined,
            ...(TypeValidatorSchema<any>[] | undefined[])
          ]
        | [],
      Returns extends TypeValidatorSchema<any> | undefined
    >(
      args: Args,
      returns: Returns,
      isRequired = false
    ): FunctionValidatorSchema<Args, Returns> {
      return new FunctionValidatorSchema(
        {
          args: args ?? [],
          returns: returns,
        },
        isRequired
      );
    }

    public static optional<T extends TypeValidatorSchema<any>>(
      typeSchema: T
    ): TypeValidatorSchema<Infer<T> | undefined> {
      return new TypeValidatorSchema(typeSchema.type, false);
    }

    public static enum<T extends string>(
      schema: T[],
      isRequired = false
    ): EnumValueValidatorSchema<(typeof schema)[number]> {
      return new EnumValueValidatorSchema(schema, isRequired);
    }

    public static oneOfType<T extends TypeValidatorSchema<any>[]>(
      typeSchema: T
    ): TypeValidatorSchema<Infer<T[number]>> {
      const types = typeSchema.map((validator) => validator.type).flat();
      return TypeChecker._getValidatorForPrimitiveType(types, false);
    }
  }

  export const object = TypeChecker.object;
  export const array = TypeChecker.array;
  export const number = TypeChecker.number;
  export const string = TypeChecker.string;
  export const boolean = TypeChecker.boolean;
  export const func = TypeChecker.func;
  export const optional = TypeChecker.optional;
  export const enumeration = TypeChecker.enum;
  export const oneOfType = TypeChecker.oneOfType;
}
