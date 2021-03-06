import { ForbiddenException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  generateToken() {
    const token = crypto.randomBytes(64).toString('hex');
    return token;
  }

  async findOne(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
    });
    const isSessionExpired = dayjs().isAfter(dayjs(session!.expiration));

    if (!session && !isSessionExpired) {
      throw new ForbiddenException();
    }

    return session;
  }

  async isSessionValid(token: string) {
    const session = await this.findOne(token);

    return dayjs().isAfter(dayjs(session!.expiration));
  }

  async create(id: number) {
    const token = this.generateToken();
    const expirationDate = dayjs(new Date()).add(2, 'days').toISOString();
    return this.prisma.session.create({
      data: {
        token,
        expiration: expirationDate,
        user: {
          connect: {
            id,
          },
        },
      },
    });
  }
}
