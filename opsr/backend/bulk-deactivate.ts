import { Body, Controller, Patch, Req, HttpCode } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';

interface BulkDeactivateDto {
  userIds: string[];
}

interface BulkDeactivateResult {
  deactivated: number;
  skipped: string[];
}

@Controller('api/v1/admin/users')
export class BulkDeactivateController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Patch('bulk-deactivate')
  @HttpCode(200)
  async bulkDeactivate(
    @Body() dto: BulkDeactivateDto,
    @Req() req: { user: { id: string } },
  ): Promise<BulkDeactivateResult> {
    const { userIds } = dto;
    const adminId = req.user.id;
    const skipped: string[] = [];

    const filtered = userIds.filter((id) => {
      if (id === adminId) {
        skipped.push(id);
        return false;
      }
      return true;
    });

    const users = await this.userRepo.findBy({ id: In(filtered) });
    const foundIds = new Set(users.map((u) => u.id));

    for (const id of filtered) {
      if (!foundIds.has(id)) skipped.push(id);
    }

    const toDeactivate = users.filter((u) => u.isActive);
    const alreadyInactive = users.filter((u) => !u.isActive).map((u) => u.id);
    skipped.push(...alreadyInactive);

    if (toDeactivate.length > 0) {
      await this.userRepo.update(
        { id: In(toDeactivate.map((u) => u.id)) },
        { isActive: false },
      );
    }

    return { deactivated: toDeactivate.length, skipped };
  }
}
