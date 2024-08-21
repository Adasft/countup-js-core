# CountUp JS Core ⏲️

CountUp JS Core is a free and simple library designed to quickly animate numerical values with ease. It offers an easy-to-use API and focuses exclusively on performing animations and calculations of values, leaving the decision of how to use or render these values in the DOM or elsewhere entirely up to you.

Although the name CountUp suggests that it only counts numerical values upwards, it can actually animate in any direction: upward (positive), downward (negative), and transitions between positive and negative values, providing complete flexibility in animating numerical values.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API](#api)
  - [NumericalAnimatorCore](#numericalanimatorcore)
    - [Constructor](#constructor)
    - [Methods](#methods)
- [Examples](#examples)
- [License](#license)

## Installation

### NPM

You can install the library using npm:

```sh
npm install countup-js-core
```

## Quick Start

Here is a basic example of how to use the CountUp JS Core library to animate numerical values:

```javascript
import { CountUp } from "countup-js-core";

const animator = new CountUp.NumericalAnimatorCore({
  start: 0,
  end: 100,
  duration: 5,
  onChange: (currentValue) => {
    console.log(currentValue);
  },
});

animator.play();
```

### Explanation

1. Import Necessary Modules:

```javascript
import { CountUp } from "countup-js-core";
```

Here we import the `NumericalAnimatorCore` class from the `countup-js-core` library.

2. Create an Instance of NumericalAnimatorCore:

```javascript
const animator = new CountUp.NumericalAnimatorCore({
  start: 0,
  end: 100,
  duration: 5,
  onChange: (currentValue) => {
    console.log(currentValue);
  },
});
```

- `{ start: 0, end: 100, duration: 5 }`: Defines the animation parameters:
  - `start`: Starting value of the animation (0 in this case).
  - `end`: Ending value of the animation (100 in this case).
  - `duration`: Duration of the animation in seconds (5 seconds in this case).
  - `onChange`: A function that will be executed each time the numeric value changes.

3. Start the Animation:

```javascript
animator.play();
```

Calls the `play()` method on the `NumericalAnimatorCore` instance to start the animation from the initial value to the final value over the specified duration.

This example demonstrates how to set up and run a simple animation using CountUp JS Core. You can customize the parameters according to your needs to animate any range of numerical values over your preferred duration.

## API

### NumericalAnimatorCore

#### Constructor

```javascript
new CountUp.NumericalAnimatorCore(options: NumericalAnimatorCoreOptions);
```

#### Parameters

- `options` (NumericalAnimatorCoreOptions): Configuration options object.

#### NumericalAnimatorCoreOptions

```ts
type NumericalAnimatorCoreOptions = {
  start: number;
  end: number;
  duration: number;
  abortOnError?: boolean;
  debug?: boolean;
  easingFunction?: EasingFunction | keyof EasingUtil;
  decimalPlaces?: number;
  autoPlay?: boolean;
  middleware?: Middleware[];
  onChange?: (value: number | string) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
  onError?: (message: string) => void;
};
```

#### AnimationFrameUpdatedOptions

```ts
type AnimationFrameUpdatedOptions = {
  end?: number;
  duration?: number;
  easingFunction?: EasingFunction;
  decimalPlaces?: number;
};
```

#### UtilityEasingFunctions

```ts
type EasingFunction = (t: number) => number;
type UtilityEasingFunctions {
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
}
```

#### Propiedades

- `isPaused: boolean`
  Indicates whether the animation is paused.
- `emitter: Emitter`
  Event emitter instance.
- `errors: Error[]`
  Error message.

#### Methods

- `play(): void`
  Starts the animation.

- `pause(): void`
  Pauses the animation.

- `reset(): void`
  Resets the animation.

- `stop(): void`
  Stops the animation.

- `update(updatedOptions: AnimationFrameUpdatedOptions): void`
  Updates the animation properties.

- `printErrors(): void`
  Prints the error messages.

- `applyMiddleware(value: number): number | string`
  Applies the middleware to the value.

- `addMiddleware(middleware: Middleware): void`
  AAdds middleware to modify the values during the animation.

## Examples

### Basic Animation

```javascript
import { CountUp } from "countup-js-core";

const animator = new CountUp.NumericalAnimatorCore({
  start: 0,
  end: 200,
  duration: 10,
  easingFunction: CountUp.EasingUtil.easeInOutSine,
  onChange: (value) => {
    console.log(`Current Value: ${value}`);
  },
  onComplete: () => {
    console.log("Animation Complete!");
  },
});

animator.play();
```

### Using Middleware

Middlewares are functions that process the value before calling `onChange()`. They return the processed value, which must be a number or a string.

```javascript
import { CountUp } from "countup-js-core";

const animator = new CountUp.NumericalAnimatorCore({
  start: 0,
  end: 100,
  duration: 5,
  middleware: [
    (value) => value * 2, // Double the value
    (value) => `Value: ${value}`, // Convert to string
  ],
  onChange: (value) => {
    console.log(value); // Output: "Value: 0", "Value: 2", ..., "Value: 200"
  },
});

animator.play();
```

#### Formatting the Final Value

You can use the `addMiddleware(middleware: Middleware)` method to add a new middleware that formats the number after creating the instance:

```javascript
animator.addMiddleware((value) =>
  Intl.NumberFormat(undefined, {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
);

animator.play();
```

Ensure that any previously registered middleware returns a number; otherwise, you might get unexpected results.

## License

This project is licensed under the terms of the [MIT License](https://opensource.org/license/mit).
