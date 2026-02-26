import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(data: any) {
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new ConflictException('Email already exists');

        // First user gets ADMIN role, subsequent users get the requested role or VIEWER
        const userCount = await this.prisma.user.count();
        const role = userCount === 0 ? 'ADMIN' : (data.role || 'VIEWER');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role,
            },
        });

        return this.generateToken(user);
    }

    async login(data: any) {
        const user = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(data.password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, role: user.role }
        };
    }
}
