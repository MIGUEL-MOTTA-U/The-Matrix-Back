import type { CustomMapKey } from '../schemas/zod.js';
import type CustomUserQueueMapInterface from './CustomUserQueueMapInterface.js';
export default class CustomQueuesMap<_any1, _any2>
  implements CustomUserQueueMapInterface<CustomMapKey, _any2>
{
  private readonly map: Map<string, _any2>;
  constructor() {
    this.map = new Map();
  }
  public size(): number {
    return this.map.size;
  }
  public add(criteria: CustomMapKey, value: _any2): void {
    const key = this.criteriaToKey(criteria);
    this.map.set(key, value);
  }
  public get(criteria: CustomMapKey): _any2 | undefined {
    const key = this.criteriaToKey(criteria);
    return this.map.get(key);
  }
  public remove(criteria: CustomMapKey): void {
    const key = this.criteriaToKey(criteria);
    this.map.delete(key);
  }
  public clear(): void {
    this.map.clear();
  }
  private criteriaToKey(criteria: CustomMapKey): string {
    return `${criteria.map}:${criteria.level}`;
  }
}
