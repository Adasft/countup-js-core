import AnimationFrame from "./animationFrame";
import {
  requestAnimationFrame,
  cancelAnimationFrame,
} from "../utils/polyfills";

export default class RequestAnimationFrame {
  private static _INSTANCE: RequestAnimationFrame;

  private _animationFrameQueue: AnimationFrame[] = [];
  private _requestAnimationFrameId: number | null = null;
  private _pausedAnimationCounter: number = 0;

  public readonly version = "1.0.0";

  public constructor() {
    if (!RequestAnimationFrame._INSTANCE) {
      RequestAnimationFrame._INSTANCE = this;
    }

    return RequestAnimationFrame._INSTANCE;
  }

  private _frameRequestCallback(currentTime: number) {
    if (this.cancelAnimationIfQueueEmpty()) {
      return;
    }

    for (const animationFrame of this._animationFrameQueue) {
      const timeTrackingMethods = animationFrame.fetchTimeTrackingMethods();

      if (timeTrackingMethods.getIsPaused()) {
        continue;
      }

      timeTrackingMethods.setCurrentTime(
        currentTime - timeTrackingMethods.getElapsedTime()
      );

      animationFrame.run(timeTrackingMethods.getCurrentTime());
    }

    this._requestAnimationFrameId = requestAnimationFrame(
      (currentTime: number) => {
        this._frameRequestCallback(currentTime);
      }
    );
  }

  public runAnimationFrame() {
    if (this._requestAnimationFrameId === null) {
      this._requestAnimationFrameId = requestAnimationFrame(
        (currentTime: number) => {
          this._frameRequestCallback(currentTime);
        }
      );
    }
  }

  public cancelAnimationFrame(): boolean {
    if (!this._requestAnimationFrameId) {
      return false;
    }
    cancelAnimationFrame(this._requestAnimationFrameId);
    this._requestAnimationFrameId = null;
    return true;
  }

  public enqueueFrameAndRunAnimationFrame(animationFrame: AnimationFrame) {
    if (animationFrame) {
      this._animationFrameQueue.push(animationFrame);
    }

    this.runAnimationFrame();
  }

  public removeFromQueue(id: number, callback: () => void) {
    const index = this._animationFrameQueue.findIndex((af) => af.id === id);

    if (index === -1) {
      return;
    }

    callback();
    this._animationFrameQueue.splice(index, 1);
  }

  public cancelAnimationIfQueueEmpty() {
    if (!this.queueSize()) {
      return this.cancelAnimationFrame();
    }
    return false;
  }

  public queueSize() {
    return this._animationFrameQueue.length;
  }

  public getFrameId(): number | null {
    return this._requestAnimationFrameId;
  }

  public resetFrameId() {
    this._requestAnimationFrameId = null;
  }

  public increasePausedCounter() {
    this._pausedAnimationCounter++;
  }

  public decreasePausedCounter() {
    this._pausedAnimationCounter--;
  }

  public resetPausedCounter() {
    this._pausedAnimationCounter = 0;
  }

  public getPausedCounter() {
    return this._pausedAnimationCounter;
  }
}
