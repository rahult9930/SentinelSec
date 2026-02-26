import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(data: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
        };
    }>;
    login(data: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
        };
    }>;
    private generateToken;
}
