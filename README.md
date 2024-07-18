# CountUp JS Core ⏲️

CountUp JS Core is a free and simple library designed to quickly animate numerical values with ease. It offers an easy-to-use API and focuses exclusively on performing animations and calculations of values, leaving the decision of how to use or render these values in the DOM or elsewhere entirely up to you.

Although the name CountUp suggests that it only counts numerical values upwards, it can actually animate in any direction: upward (positive), downward (negative), and transitions between positive and negative values, providing complete flexibility in animating numerical values.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API](#api)
  - [AnimatorCore](#animatorcore)
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
import { AnimatorCore, RequestAnimatorFrame } from "countup-js-core";

const animator = new AnimatorCore(new RequestAnimatorFrame(), {
  start: 0,
  end: 100,
  duration: 5,
  onValueChange: (currentValue) => {
    console.log(currentValue);
  },
});

animator.play();
```

### Explanation

1. Import Necessary Modules:

```javascript
import { AnimatorCore, RequestAnimatorFrame } from "countup-js-core";
```

Here we import the `AnimatorCore` and `RequestAnimatorFrame` classes from the `countup-js-core` library.

2. Create an Instance of AnimatorCore:

```javascript
const animator = new AnimatorCore(new RequestAnimatorFrame(), {
  start: 0,
  end: 100,
  duration: 5,
  onValueChange: (currentValue) => {
    console.log(currentValue);
  },
});
```

- `new RequestAnimatorFrame()`: Creates an instance of `RequestAnimatorFrame`, which handles animation frames.
- `{ start: 0, end: 100, duration: 5 }`: Defines the animation parameters:
  - `start`: Starting value of the animation (0 in this case).
  - `end`: Ending value of the animation (100 in this case).
  - `duration`: Duration of the animation in seconds (5 seconds in this case).
  - `onValueChange`: A function that will be executed each time the numeric value changes.

3. Start the Animation:

```javascript
animator.play();
```

Calls the `play()` method on the `AnimatorCore` instance to start the animation from the initial value to the final value over the specified duration.

This example demonstrates how to set up and run a simple animation using CountUp JS Core. You can customize the parameters according to your needs to animate any range of numerical values over your preferred duration.

## API

### AnimatorCore

#### Constructor

```javascript
new AnimatorCore(rAF: RequestAnimationFrame, options: AnimatorCoreOptions);
```

#### Parameters

- `rAF` (RequestAnimationFrame): Instance of `RequestAnimationFrame`.
- `options` (AnimatorCoreOptions): Configuration options object.

#### AnimatorCoreOptions

```ts
type AnimatorCoreOptions = {
  start: number;
  end: number;
  duration: number;
  easingFunction?: EasingFunction | keyof EasingUtil;
  decimalPlaces?: number;
  autoPlay?: boolean;
  middleware?: Middleware[];
  onValueChange?: (value: number | string) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onReset?: () => void;
};
```

#### AnimationFrameUpdatedOptions

```ts
type AnimationFrameUpdatedOptions = {
  end: number;
  duration: number;
  easingFunction: EasingFunction;
  decimalPlaces: number;
};
```

#### Propiedades

- `isPaused: boolean`
  Indicates whether the animation is paused.

#### Methods

- `play(callback?: () => void): void`
  Starts the animation.

- `pause(): void`
  Pauses the animation.

- `reset(callback?: () => void): void`
  Resets the animation.

- `update(updatedOptions: AnimationFrameUpdatedOptions): void`
  Updates the animation properties.

- `addMiddleware(middleware: Middleware): void`
  Adds middleware to modify the values during the animation.

## Examples

### Basic Animation

```javascript
import { AnimatorCore, RequestAnimatorFrame } from "countup-js-core";

const animator = new AnimatorCore(new RequestAnimatorFrame(), {
  start: 0,
  end: 200,
  duration: 10,
  onValueChange: (value) => {
    console.log(`Current Value: ${value}`);
  },
  onComplete: () => {
    console.log("Animation Complete!");
  },
});

animator.play();
```

### Using Middleware

Middlewares are functions that process the value before calling `onValueChange()`. They return the processed value, which must be a number or a string.

```javascript
import { AnimatorCore, RequestAnimatorFrame } from "countup-js-core";

const animator = new AnimatorCore(new RequestAnimatorFrame(), {
  start: 0,
  end: 100,
  duration: 5,
  middleware: [
    (value) => value * 2, // Double the value
    (value) => `Value: ${value}`, // Convert to string
  ],
  onValueChange: (value) => {
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
