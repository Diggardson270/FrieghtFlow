import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Controller, Get, Post, Body, Param, Req, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Entity()
export class ShipmentComment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() shipmentId: string;
  @Column() authorId: string;
  @Column('text') body: string;
  @CreateDateColumn() createdAt: Date;
}

interface CommentDto { body: string }

type AuthReq = { user: { id: string; role: string } };

function assertAccess(
  shipment: { shipperId: string; carrierId: string },
  userId: string,
  role: string,
) {
  const isParty = shipment.shipperId === userId || shipment.carrierId === userId;
  if (!isParty && role !== 'ADMIN') throw new ForbiddenException();
}

@Controller('api/v1/shipments/:id/comments')
export class ShipmentCommentsController {
  constructor(
    @InjectRepository(ShipmentComment)
    private readonly commentRepo: Repository<ShipmentComment>,
  ) {}

  @Get()
  async list(@Param('id') id: string, @Req() req: AuthReq) {
    const shipment = await this.getShipment(id);
    assertAccess(shipment, req.user.id, req.user.role);
    return this.commentRepo.findBy({ shipmentId: id });
  }

  @Post()
  async create(@Param('id') id: string, @Body() dto: CommentDto, @Req() req: AuthReq) {
    const shipment = await this.getShipment(id);
    assertAccess(shipment, req.user.id, req.user.role);
    const comment = this.commentRepo.create({ shipmentId: id, authorId: req.user.id, body: dto.body });
    return this.commentRepo.save(comment);
  }

  // Stub — replace with actual shipment lookup via injected service
  private async getShipment(id: string): Promise<{ shipperId: string; carrierId: string }> {
    void id;
    return { shipperId: '', carrierId: '' };
  }
}
