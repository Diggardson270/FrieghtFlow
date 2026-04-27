import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Entity()
export class CarrierPreferences {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() carrierId: string;
  @Column('text', { array: true, default: [] }) originRegions: string[];
  @Column('text', { array: true, default: [] }) destinationRegions: string[];
  @Column('float', { nullable: true }) maxWeightKg: number | null;
  @Column('text', { array: true, default: [] }) preferredCargo: string[];
}

interface PreferencesDto {
  originRegions: string[];
  destinationRegions: string[];
  maxWeightKg?: number;
  preferredCargo?: string[];
}

@Controller('api/v1/carriers/me/preferences')
export class CarrierPreferencesController {
  constructor(
    @InjectRepository(CarrierPreferences)
    private readonly repo: Repository<CarrierPreferences>,
  ) {}

  @Get()
  async get(@Req() req: { user: { id: string } }) {
    return (
      (await this.repo.findOneBy({ carrierId: req.user.id })) ?? {}
    );
  }

  @Put()
  async upsert(
    @Body() dto: PreferencesDto,
    @Req() req: { user: { id: string } },
  ) {
    const existing = await this.repo.findOneBy({ carrierId: req.user.id });
    const record = this.repo.create({
      ...existing,
      carrierId: req.user.id,
      ...dto,
    });
    return this.repo.save(record);
  }
}
