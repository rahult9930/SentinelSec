import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Post()
    create(@Body() body: any) {
        return this.assetsService.create(body);
    }

    @Get()
    findAll() {
        return this.assetsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.assetsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.assetsService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.assetsService.remove(id);
    }
}
