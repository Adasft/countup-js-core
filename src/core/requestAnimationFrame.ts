import AnimationFrame from "./animationFrame";
import { cancelAnimationFrame } from "../utils/polyfills";

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
      const timeTrackingData = animationFrame.fetchTimeTrackingData();

      if (timeTrackingData.isPaused) {
        continue;
      }

      timeTrackingData.currentTime = currentTime - timeTrackingData.elapsedTime;

      animationFrame.run(timeTrackingData.currentTime);
    }

    this._requestAnimationFrameId = requestAnimationFrame(
      (currentTime: number) => {
        this._frameRequestCallback(currentTime);
      }
    );
  }

  public runRequestAnimationFrame() {
    if (this._requestAnimationFrameId === null) {
      this._requestAnimationFrameId = requestAnimationFrame(
        (currentTime: number) => {
          this._frameRequestCallback(currentTime);
        }
      );
    }
  }

  public enqueueFrameAndRunAnimationFrame(animationFrame: AnimationFrame) {
    if (animationFrame) {
      this._animationFrameQueue.push(animationFrame);
    }

    this.runRequestAnimationFrame();
  }

  public removeFromQueue(id: number, callback: () => void) {
    const index = this._animationFrameQueue.findIndex((af) => af.id === id);

    if (index === -1) {
      throw new Error(
        `Cannot remove animationFrame: frame with id ${id} does not exist.`
      );
    }

    callback();
    this._animationFrameQueue.splice(index, 1);
  }

  public cancelAnimationIfQueueEmpty() {
    if (!this._animationFrameQueue.length && this._requestAnimationFrameId) {
      cancelAnimationFrame(this._requestAnimationFrameId);
      this._requestAnimationFrameId = null;
      return true;
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
