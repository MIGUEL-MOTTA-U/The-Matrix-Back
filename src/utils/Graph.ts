type Edge<T> = { to: T; weight: number };

/**
 * @class Graph
 * Represents a weighted graph data structure that can be used for pathfinding algorithms.
 * The graph supports both directional and bidirectional edges, and implements Dijkstra's algorithm
 * for finding the shortest path between nodes.
 *
 * @since 25/04/2025
 * @author Your Name
 */
export class Graph<T> {
  private adj: Map<T, Edge<T>[]> = new Map();

  /**
   * Adds a node to the graph if it doesn't already exist.
   *
   * @param {T} node The node to add to the graph.
   * @return {void}
   */
  public addNode(node: T): void {
    if (!this.adj.has(node)) {
      this.adj.set(node, []);
    }
  }

  /**
   * Adds an edge between two nodes with a specified weight.
   * If the nodes don't exist, they are created automatically.
   *
   * @param {T} from The starting node of the edge.
   * @param {T} to The ending node of the edge.
   * @param {number} [weight=1] The weight of the edge, defaults to 1.
   * @param {boolean} [bidirectional=true] Whether the edge should be bidirectional, defaults to true.
   * @return {void}
   */
  public addEdge(from: T, to: T, weight = 1, bidirectional = true): void {
    this.addNode(from);
    this.addNode(to);
    const fromEdges = this.adj.get(from);
    if (fromEdges) {
      fromEdges.push({ to, weight });
    }

    if (bidirectional) {
      const toEdges = this.adj.get(to);
      if (toEdges) {
        toEdges.push({ to: from, weight });
      }
    }
  }

  /**
   * Finds the shortest path between two nodes using Dijkstra's algorithm.
   *
   * @param {T} start The starting node.
   * @param {T} end The destination node.
   * @return {{ distance: number; path: T[] }} An object containing the total distance and the array of nodes in the path.
   */
  public shortestPathDijkstra(start: T, end: T): { distance: number; path: T[] } {
    const dist: Map<T, number> = new Map();
    const prev: Map<T, T | null> = new Map();
    const pq = new MinPriorityQueue<T>();

    this.adj.forEach((_, node) => {
      dist.set(node, Number.POSITIVE_INFINITY);
      prev.set(node, null);
    });
    dist.set(start, 0);
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
      const dequeued = pq.dequeue();
      if (!dequeued) break;

      const u = dequeued.element;
      if (u === end) break;

      const neighbors = this.adj.get(u);
      if (!neighbors) continue;

      for (const { to: v, weight } of neighbors) {
        const uDist = dist.get(u);
        const vDist = dist.get(v);

        if (uDist === undefined || vDist === undefined) continue;

        const alt = uDist + weight;
        if (alt < vDist) {
          dist.set(v, alt);
          prev.set(v, u);
          pq.enqueue(v, alt);
        }
      }
    }

    const path: T[] = [];
    let u: T | null = end;

    if (u) {
      const prevU = prev.get(u);
      if (prevU !== null || u === start) {
        while (u) {
          path.unshift(u);
          u = prev.get(u) ?? null;
        }
      }
    }

    const finalDistance = dist.get(end) ?? Number.POSITIVE_INFINITY;
    return { distance: finalDistance, path };
  }
}

/**
 * @class MinPriorityQueue
 * A priority queue implementation that always returns the element with the lowest priority value.
 * Used internally by the Graph class for Dijkstra's algorithm.
 *
 * @since 25/04/2025
 * @author Your Name
 */
class MinPriorityQueue<T> {
  private heap: { element: T; priority: number }[] = [];

  /**
   * Checks if the priority queue is empty.
   *
   * @return {boolean} True if the queue is empty, false otherwise.
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Adds an element to the priority queue with the specified priority.
   *
   * @param {T} element The element to add.
   * @param {number} priority The priority of the element (lower values have higher priority).
   * @return {void}
   */
  public enqueue(element: T, priority: number): void {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the element with the lowest priority value.
   *
   * @return {{ element: T; priority: number } | undefined} The element with the lowest priority, or undefined if the queue is empty.
   */
  public dequeue(): { element: T; priority: number } | undefined {
    if (this.isEmpty()) return undefined;
    this.swap(0, this.heap.length - 1);
    const min = this.heap.pop();
    if (min === undefined) return undefined;
    this.bubbleDown(0);
    return min;
  }

  /**
   * Moves an element up in the heap until it's in the correct position.
   *
   * @private
   * @param {number} idx The index of the element to bubble up.
   * @return {void}
   */
  private bubbleUp(idx: number) {
    if (idx === 0) return;
    const parent = Math.floor((idx - 1) / 2);
    if (this.heap[parent].priority > this.heap[idx].priority) {
      this.swap(parent, idx);
      this.bubbleUp(parent);
    }
  }

  /**
   * Moves an element down in the heap until it's in the correct position.
   *
   * @private
   * @param {number} idx The index of the element to bubble down.
   * @return {void}
   */
  private bubbleDown(idx: number) {
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    let smallest = idx;

    if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) {
      smallest = left;
    }
    if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) {
      smallest = right;
    }
    if (smallest !== idx) {
      this.swap(idx, smallest);
      this.bubbleDown(smallest);
    }
  }

  /**
   * Swaps two elements in the heap.
   *
   * @private
   * @param {number} i The index of the first element.
   * @param {number} j The index of the second element.
   * @return {void}
   */
  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
