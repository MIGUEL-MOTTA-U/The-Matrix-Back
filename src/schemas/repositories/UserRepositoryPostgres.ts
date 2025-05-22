import type { PrismaClient, User } from '@prisma/client';
import MatchError from '../../errors/MatchError.js';
import type UserRepository from '../UserRepository.js';
import { type PlayerType, type UserQueue, validateUserQueue } from '../zod.js';

export default class UserRepositoryPostgres implements UserRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  public async getUserById(userId: string): Promise<UserQueue> {
    const user = await this.requestUser(userId);
    if (!user) throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    const userQueue = {
      id: user.id,
      color: user.color,
      matchId: user.matchId,
      role: user.playerRole as PlayerType,
      name: user.name,
      status: user.status as 'WAITING' | 'PLAYING' | 'READY',
    };
    return userQueue;
  }
  public async updateUser(userId: string, userData: Partial<UserQueue>): Promise<void> {
    const user = await this.requestUser(userId);
    if (!user) throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    const matchId: string | null =
      userData.matchId && userData.matchId.length > 0 ? userData.matchId : null;
    const status = (userData.status?.toUpperCase() as 'WAITING' | 'PLAYING' | 'READY') ?? 'WAITING';
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        color: userData.color,
        matchId: matchId,
        playerRole: userData.role,
        status: status,
        name: userData.name,
      },
    });
  }
  public async deleteUser(userId: string): Promise<void> {
    const user = await this.requestUser(userId);
    if (!user) throw new MatchError(MatchError.PLAYER_NOT_FOUND);

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
  public async createUser(user: UserQueue): Promise<void> {
    const role = user.role ?? 'HOST';
    await this.prisma.user.create({
      data: {
        id: user.id,
        color: user.color,
        matchId: user.matchId,
        playerRole: role,
        name: user.name,
        expiredAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
        status: user.status ?? 'WAITING',
      },
    });
  }
  public async getAllUsers(): Promise<UserQueue[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => {
      return validateUserQueue({
        id: user.id,
        color: user.color,
        matchId: user.matchId,
        name: user.name,
        role: user.playerRole as PlayerType,
        status: user.status,
      });
    });
  }
  public async extendSession(userId: string, duration: number): Promise<void> {
    const user = await this.requestUser(userId);
    if (!user) throw new MatchError(MatchError.PLAYER_NOT_FOUND);

    const newExpirationDate = new Date(Date.now() + duration * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { expiredAt: newExpirationDate },
    });
  }
  public async userExists(userId: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id: userId } })) > 0;
  }

  private async requestUser(userId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
