export type EngineEventMap = {
  'engine:tick': { tick: number; deltaSeconds: number };
  'mission:outcome': { outcome: 'victory' | 'defeat' };
};

type Listener<T> = (payload: T) => void;

/** Small typed event channel shared by engine systems. */
export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set<Listener<never>>();
      this.listeners.set(event, bucket);
    }
    bucket.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const bucket = this.listeners.get(event);
    bucket?.delete(listener as Listener<never>);
    if (bucket?.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(payload as never));
  }

  clear(): void {
    this.listeners.clear();
  }
}
