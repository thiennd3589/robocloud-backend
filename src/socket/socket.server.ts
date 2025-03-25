import {Application} from '@loopback/core';
import {AnyObject} from '@loopback/repository';
import {Server} from 'http';
import socketIo, {Socket} from 'socket.io';

export class SocketIoServer {
  private io: socketIo.Server;

  constructor(
    private app: Application,
    private httpServer: Server,
    private port: number = 3001,
  ) {
    this.io = new socketIo.Server(this.httpServer, {
      path: '/socket.io',
      cors: {
        origin: '*', // Allow all origins (adjust for production)
        methods: ['GET', 'POST'],
      },
    });

    this.bindSocketEvents();
  }

  private bindSocketEvents() {
    this.io.on('connection', (socket: Socket) => {
      console.log('A client connected:', socket.id);
      console.log('socket', socket);

      // Example: Handle custom events
      socket.on('message', (data: AnyObject) => {
        console.log('Received message:', data);
        this.io.emit('message', data); // Broadcast to all clients
      });

      socket.on('disconnect', () => {
        console.log('A client disconnected:', socket.id);
      });
    });
  }

  async start() {
    this.httpServer.listen(this.port, () => {
      console.log(`Socket.IO server running on port ${this.port}`);
    });
  }

  async stop() {
    this.io.close();
  }
}
