export default interface CustomUserQueueMapInterface<_any1, _any2> {
  size(): number;
  add(key: _any1, value: _any2): void;
  get(key: _any1): _any2 | undefined;
  remove(key: _any1): void;
  clear(): void;
}
