import type WebSocket from 'ws';
export default interface SocketConnectionsService {
  registerConnection: (userId: string, socket: WebSocket) => Map<string, WebSocket>;
  removeConnection: (userId: string) => boolean;
  getConnection: (userId: string) => WebSocket | undefined;
  isConnected: (userId: string) => boolean;
  clearConnections: () => void;
}
