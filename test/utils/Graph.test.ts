import { describe, test, expect } from 'vitest';
import { Graph } from '../../src/utils/Graph.js';

describe('Graph', () => {
  // Basic graph operations tests
  describe('Basic operations', () => {
    test('should add nodes correctly', () => {
      const graph = new Graph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      
      // Add node twice should not cause issues
      graph.addNode('A');
      
      // Test by using the nodes in an edge operation
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      
      const result = graph.shortestPathDijkstra('A', 'C');
      expect(result.path).toEqual(['A', 'B', 'C']);
    });

    test('should add bidirectional edges correctly', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 1);
      
      // Should be able to go from A to B and B to A
      expect(graph.shortestPathDijkstra('A', 'B').path).toEqual(['A', 'B']);
      expect(graph.shortestPathDijkstra('B', 'A').path).toEqual(['B', 'A']);
    });

    test('should add directional edges correctly', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 1, false); // One-way from A to B
      
      // Should be able to go from A to B but not B to A
      expect(graph.shortestPathDijkstra('A', 'B').path).toEqual(['A', 'B']);
      expect(graph.shortestPathDijkstra('B', 'A').path).toEqual([]);
      expect(graph.shortestPathDijkstra('B', 'A').distance).toBe(Number.POSITIVE_INFINITY);
    });
  });

  // Dijkstra's algorithm tests
  describe('Dijkstra algorithm', () => {
    test('should find shortest path in a simple graph', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', 2);
      graph.addEdge('A', 'C', 5);
      
      const result = graph.shortestPathDijkstra('A', 'C');
      expect(result.path).toEqual(['A', 'B', 'C']);
      expect(result.distance).toBe(3); // 1 + 2
    });

    test('should find shortest path in a more complex graph', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 4);
      graph.addEdge('A', 'C', 2);
      graph.addEdge('B', 'E', 3);
      graph.addEdge('C', 'D', 2);
      graph.addEdge('D', 'E', 3);
      graph.addEdge('C', 'F', 4);
      graph.addEdge('D', 'F', 1);
      graph.addEdge('E', 'Z', 2);
      graph.addEdge('F', 'Z', 3);
      
      const result = graph.shortestPathDijkstra('A', 'Z');
      expect(result.path).toEqual(['A', 'C', 'D', 'F', 'Z']);
      expect(result.distance).toBe(8); // 2 + 2 + 1 + 3
    });

    test('should return empty path when no path exists', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('C', 'D', 1);
      
      const result = graph.shortestPathDijkstra('A', 'D');
      expect(result.path).toEqual([]);
      expect(result.distance).toBe(Number.POSITIVE_INFINITY);
    });

    test('should handle when start and end are the same node', () => {
      const graph = new Graph();
      graph.addEdge('A', 'B', 1);
      graph.addEdge('B', 'C', 1);
      
      const result = graph.shortestPathDijkstra('A', 'A');
      expect(result.path).toEqual(['A']);
      expect(result.distance).toBe(0);
    });

    test('should handle numeric nodes', () => {
      const graph = new Graph();
      graph.addEdge('1', '2', 5);
      graph.addEdge('2', '3', 3);
      graph.addEdge('1', '3', 10);
      
      const result = graph.shortestPathDijkstra('1', '3');
      expect(result.path).toEqual(['1', '2', '3']);
      expect(result.distance).toBe(8);
    });

    test('should handle custom object nodes', () => {      
      const a = { x: 0, y: 0 };
      const b = { x: 1, y: 1 };
      const c = { x: 2, y: 2 }; 
      
      const graph = new Graph();
      graph.addEdge(JSON.stringify(a), JSON.stringify(b), 1);
      graph.addEdge(JSON.stringify(b), JSON.stringify(c), 1);
      
      const result = graph.shortestPathDijkstra(JSON.stringify(a), JSON.stringify(c));
      expect(result.path).toEqual([JSON.stringify(a), JSON.stringify(b), JSON.stringify(c)]);
      expect(result.distance).toBe(2);
    });
  });
});