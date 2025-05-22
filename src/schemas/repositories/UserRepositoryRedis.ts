import MatchError from '../../errors/MatchError.js';
import { redis } from '../../server.js';
import type UserRepository from '../UserRepository.js';
import type { UserQueue } from '../zod.js';

export default class UserRepositoryRedis implements UserRepository {
  public async userExists(userId: string): Promise<boolean> {
    return (await redis.exists(`users:${userId}`)) === 1;
  }
  public async extendSession(userId: string, duration: number): Promise<void> {
    await redis.expire(`users:${userId}`, duration * 60); // duration in minutes
  }
  public async getAllUsers(): Promise<UserQueue[]> {
    const keys = await redis.keys('users:*');
    const users: UserQueue[] = await Promise.all(
      keys.map(async (key) => {
        const user = await redis.hgetall(key);
        return { id: key.split(':')[1], ...user } as UserQueue;
      })
    );
    return users;
  }
  public async deleteUser(userId: string): Promise<void> {
    await redis.del(`users:${userId}`);
  }
  public async createUser(user: UserQueue): Promise<void> {
    const userId = user.id;
    const matchId = user.matchId ?? '';
    await redis.hset(`users:${userId}`, 'id', userId, 'matchId', matchId);
    await redis.expire(`users:${userId}`, 10 * 60); // 10 minutes expiration
  }
  public async getUserById(userId: string): Promise<UserQueue> {
    const user = await redis.hgetall(`users:${userId}`);
    if (Object.keys(user).length === 0) {
      throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    }
    return { id: userId, ...user } as UserQueue;
  }
  public async updateUser(userId: string, userData: Partial<UserQueue>): Promise<void> {
    const user = await redis.hgetall(`users:${userId}`);
    if (Object.keys(user).length === 0) {
      throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    }
    await redis.hset(`users:${userId}`, userData);
  }
}
