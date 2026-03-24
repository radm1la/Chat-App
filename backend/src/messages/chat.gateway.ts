import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<
    string,
    { socketId: string; lastActive: Date }
  >();

  constructor(
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'supersecretkey',
      });
      client.data.userId = payload.sub;
      client.data.username = payload.username;

      this.connectedUsers.set(payload.sub, {
        socketId: client.id,
        lastActive: new Date(),
      });

      this.server.emit('presence:update', {
        userId: payload.sub,
        status: 'online',
      });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
      this.server.emit('presence:update', {
        userId: client.data.userId,
        status: 'offline',
      });
    }
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    return { success: true };
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    return { success: true };
  }

  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; content: string; replyTo?: string },
  ) {
    const message = await this.messagesService.saveMessage(
      data.roomId,
      client.data.userId,
      data.content,
      data.replyTo,
    );

    this.server.to(data.roomId).emit('message:new', message);
    return message;
  }

  @SubscribeMessage('message:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string; roomId: string },
  ) {
    const message = await this.messagesService.editMessage(
      data.messageId,
      client.data.userId,
      data.content,
    );

    this.server.to(data.roomId).emit('message:edited', message);
    return message;
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; roomId: string },
  ) {
    await this.messagesService.deleteMessage(
      data.messageId,
      client.data.userId,
      data.roomId,
    );

    this.server
      .to(data.roomId)
      .emit('message:deleted', { messageId: data.messageId });
  }

  @SubscribeMessage('presence:afk')
  handleAfk(@ConnectedSocket() client: Socket, @MessageBody() isAfk: boolean) {
    this.server.emit('presence:update', {
      userId: client.data.userId,
      status: isAfk ? 'afk' : 'online',
    });
  }

  emitMemberCountUpdate(roomId: string, memberCount: number) {
    // Send to all connected users since member count affects public rooms list
    this.server.emit('room:members-changed', {
      roomId,
      memberCount,
    });
  }

  emitUserBanned(userId: string, roomId: string, roomName: string) {
    // Find the socket for the banned user
    const userSocket = Array.from(this.connectedUsers.entries()).find(
      ([id, socketInfo]) => id === userId,
    );

    if (userSocket) {
      this.server.to(userSocket[1].socketId).emit('user:banned', {
        roomId,
        roomName,
        message: `You've been banned from ${roomName}`,
      });
    }
  }

  emitUserUnbanned(userId: string, roomId: string, roomName: string) {
    // Find the socket for the unbanned user
    const userSocket = Array.from(this.connectedUsers.entries()).find(
      ([id, socketInfo]) => id === userId,
    );

    if (userSocket) {
      this.server.to(userSocket[1].socketId).emit('user:unbanned', {
        roomId,
        roomName,
        message: `You've been unbanned from ${roomName}`,
      });
    }
  }

  emitPersonalMessage(userId1: string, userId2: string, message: any) {
    const user1Socket = this.connectedUsers.get(userId1);
    const user2Socket = this.connectedUsers.get(userId2);

    if (user1Socket) {
      this.server.to(user1Socket.socketId).emit('personal:message', message);
    }
    if (user2Socket) {
      this.server.to(user2Socket.socketId).emit('personal:message', message);
    }
  }

  emitPersonalMessageDeleted(
    userId1: string,
    userId2: string,
    messageId: string,
  ) {
    const user1Socket = this.connectedUsers.get(userId1);
    const user2Socket = this.connectedUsers.get(userId2);

    if (user1Socket) {
      this.server
        .to(user1Socket.socketId)
        .emit('personal:message:deleted', { messageId });
    }
    if (user2Socket) {
      this.server
        .to(user2Socket.socketId)
        .emit('personal:message:deleted', { messageId });
    }
  }

  emitAdminStatusChanged(userId: string, roomId: string, isAdmin: boolean) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      this.server.to(userSocket.socketId).emit('room:admin-changed', {
        roomId,
        isAdmin,
      });
    }
  }
}
