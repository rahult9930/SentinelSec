import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.asset.create({ data });
    }

    async findAll() {
        return this.prisma.asset.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { scans: true } },
            },
        });
    }

    async findOne(id: string) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                scans: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: { _count: { select: { vulnerabilities: true } } },
                },
            },
        });
        if (!asset) throw new NotFoundException('Asset not found');
        return asset;
    }

    async update(id: string, data: any) {
        return this.prisma.asset.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.asset.delete({ where: { id } });
    }
}
