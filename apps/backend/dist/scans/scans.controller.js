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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScansController = void 0;
const common_1 = require("@nestjs/common");
const scans_service_1 = require("./scans.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ScansController = class ScansController {
    scansService;
    constructor(scansService) {
        this.scansService = scansService;
    }
    findAll() {
        return this.scansService.findAll();
    }
    quickScan(body, req) {
        return this.scansService.quickScan(body.url, req.user.userId, body.scanType, body.concurrentRequests, body.durationSeconds);
    }
    triggerScan(assetId, req) {
        return this.scansService.triggerScan(assetId, req.user.userId);
    }
    getScanStatus(id) {
        return this.scansService.getScanStatus(id);
    }
};
exports.ScansController = ScansController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('quick'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ScansController.prototype, "quickScan", null);
__decorate([
    (0, common_1.Post)(':assetId'),
    __param(0, (0, common_1.Param)('assetId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ScansController.prototype, "triggerScan", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScansController.prototype, "getScanStatus", null);
exports.ScansController = ScansController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('scans'),
    __metadata("design:paramtypes", [scans_service_1.ScansService])
], ScansController);
//# sourceMappingURL=scans.controller.js.map