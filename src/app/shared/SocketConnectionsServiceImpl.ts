import WebSocket from 'ws';
import type SocketConnectionsService from './SocketConnectionService.js';

/**
 * @class SocketConnections
 * This class manages WebSocket connections for users.
 * It allows registering, removing, and checking the status of connections.
 *
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class SocketConnections implements SocketConnectionsService {
  private readonly connections: Map<string, WebSocket>;

  constructor(map: Map<string, WebSocket> = new Map()) {
    this.connections = map;
  }

  public registerConnection(userId: string, socket: WebSocket): Map<string, WebSocket> {
    const oldSocket = this.connections.get(userId);
    if (oldSocket && oldSocket.readyState === WebSocket.OPEN) oldSocket.close();
    return this.connections.set(userId, socket);
  }

  public removeConnection(userId: string): boolean {
    return this.connections.delete(userId);
  }

  public getConnection(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }

  public isConnected(userId: string): boolean {
    return this.connections.has(userId);
  }

  public clearConnections(): void {
    this.connections.clear();
  }
}
