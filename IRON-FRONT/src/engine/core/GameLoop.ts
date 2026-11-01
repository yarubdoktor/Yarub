/**
 * Fixed-step simulation loop. Rendering may run at display refresh rate,
 * while game rules advance in stable one-second simulation steps.
 */
export class GameLoop {
  private frameId: number | null = null;
  private previousTime = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly onStep: (deltaSeconds: number) => void,
    private readonly stepMilliseconds = 1000,
    private readonly maxCatchUpSteps = 3,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.previousTime = 0;
    this.accumulator = 0;
    this.frameId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.previousTime = 0;
    this.accumulator = 0;
  }

  private frame = (time: number): void => {
    if (!this.running) return;
    if (this.previousTime === 0) this.previousTime = time;
    const elapsed = Math.min(time - this.previousTime, this.stepMilliseconds * this.maxCatchUpSteps);
    this.previousTime = time;
    this.accumulator += elapsed;

    let steps = 0;
    while (this.accumulator >= this.stepMilliseconds && steps < this.maxCatchUpSteps) {
      this.onStep(this.stepMilliseconds / 1000);
      this.accumulator -= this.stepMilliseconds;
      steps += 1;
    }
    this.frameId = requestAnimationFrame(this.frame);
  };
}
