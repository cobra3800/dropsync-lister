import { BadRequestException, Body, ConflictException, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const COOKIE = 'dropsync_session';
const jwtSecret = () => process.env.JWT_SECRET || 'dev-only-change-me';
const publicUser = (user: { id: string; email: string; name: string; role: string }) => ({ id: user.id, email: user.email, name: user.name, role: user.role });

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) res: Response) {
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!email || !name || password.length < 8) throw new BadRequestException('Name, valid email, and an 8-character password are required');
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('An account with this email already exists');

    const role = (await this.prisma.user.count()) === 0 ? 'OWNER' : 'MEMBER';
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({ data: { email, name, passwordHash, role } });
    const organization = await this.prisma.organization.create({ data: { name: `${name}'s Workspace` } });
    await this.prisma.membership.create({ data: { userId: user.id, organizationId: organization.id, role: 'OWNER' } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'auth.register' } });
    this.setCookie(res, user.id);
    return { user: publicUser(user) };
  }

  @Post('login')
  async login(@Body() body: Record<string, unknown>, @Res({ passthrough: true }) res: Response) {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'auth.login' } });
    this.setCookie(res, user.id);
    return { user: publicUser(user) };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.prisma.user.findUnique({ where: { id: this.getUserId(req) } });
    if (!user) throw new UnauthorizedException();
    return { user: publicUser(user) };
  }

  private setCookie(res: Response, userId: string) {
    const token = jwt.sign({ sub: userId }, jwtSecret(), { expiresIn: '7d' });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private getUserId(req: Request) {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new UnauthorizedException();
    try {
      return (jwt.verify(token, jwtSecret()) as { sub: string }).sub;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
