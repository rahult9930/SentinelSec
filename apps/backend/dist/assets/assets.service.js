"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssetsService = class AssetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
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
    async findOne(id) {
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
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return asset;
    }
    async update(id, data) {
        return this.prisma.asset.update({ where: { id }, data });
    }
    async remove(id) {
        return this.prisma.asset.delete({ where: { id } });
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map