import { Listener, NumericalAnimatorEvents } from "../types";

export default class EventEmitter {
  private readonly events: Map<NumericalAnimatorEvents, Listener[]> = new Map();

  public on<T>(
    eventType: NumericalAnimatorEvents,
    listener: Listener<T> | undefined
  ) {
    if (typeof listener !== "function") {
      return;
    }

    if (!this.events.has(eventType)) {
      this.events.set(eventType, [listener]);
    } else {
      this.events.get(eventType)!.push(listener);
    }
  }

  public emit<T>(eventType: NumericalAnimatorEvents, ...args: T[]) {
    if (!this.events.has(eventType)) {
      return;
    }

    this.events.get(eventType)!.forEach((listener) => {
      (listener as Listener<T>)(...args);
    });
  }
}
