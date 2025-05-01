import type { PrismaClient } from '@prisma/client';
import MatchError from '../../errors/MatchError.js';
import type MatchRepository from '../MatchRepository.js';
import { type MatchDetails, validateMatchDetails } from '../zod.js';

export default class MatchRepositoryPostgres implements MatchRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  public async getMatchById(matchId: string): Promise<MatchDetails> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: true,
      },
    });

    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);

    const host = match.players.find((player) => player.playerRole === 'HOST')?.id;
    const guest = match.players.find((player) => player.playerRole === 'GUEST')?.id;

    if (!host) throw new MatchError(MatchError.PLAYER_NOT_FOUND);

    const matchDetails = validateMatchDetails({
      id: match.id,
      host,
      guest: guest || null,
      level: match.level,
      map: match.map,
      started: match.started,
    });
    return matchDetails;
  }
  public async extendSession(matchId: string, duration: number): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);

    const newExpirationDate = new Date(Date.now() + duration * 60 * 1000);
    await this.prisma.match.update({
      where: { id: matchId },
      data: { expiredAt: newExpirationDate },
    });
  }
  public async removeMatch(matchId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);

    await this.prisma.match.delete({
      where: { id: matchId },
    });
  }
  public async updateMatch(matchId: string, matchData: Partial<MatchDetails>): Promise<void> {
    const count = await this.prisma.match.count({ where: { id: matchId } });
    if (count === 0) throw new MatchError(MatchError.MATCH_NOT_FOUND);

    await this.prisma.match.update({
      where: { id: matchId },
      data: {
        level: matchData.level,
        map: matchData.map,
        started: matchData.started,
      },
    });
  }

  public async createMatch(match: MatchDetails): Promise<void> {
    await this.prisma.match.create({
      data: {
        id: match.id,
        level: match.level,
        map: match.map,
        started: match.started ?? false,
        // no tocamos players aquí
        expiredAt: new Date(Date.now() + 20 * 60 * 1000),
      },
    });
  }
  public async matchExists(matchId: string): Promise<boolean> {
    return (await this.prisma.match.count({ where: { id: matchId } })) > 0;
  }
}
