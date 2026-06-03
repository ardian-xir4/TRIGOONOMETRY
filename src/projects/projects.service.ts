import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createPartListing(body: any) {
    const { name, price } = body;
    if (!name || !price) throw new BadRequestException('Name and price are required');
    return (this.prisma as any).partListing.create({
      data: { name, price: Number(price) },
    });
  }

  async getMarketplaceListings() {
    return (this.prisma as any).partListing.findMany();
  }

  private async linkTagsToProject(tx: any, projectId: number, tags: string[]) {
    if (!tags || tags.length === 0) return;

    for (const tagName of tags) {
      const tag = await tx.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await (tx as any).projectTag.create({
        data: { 
          projectId: Number(projectId), 
          tagId: Number(tag.id) 
        },
      });
    }
  }

  async createProject(userId: number, body: any) {
    const { title, description, imageUrl, status, tags } = body;
    if (!title) throw new BadRequestException('Project title is required');

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          title,
          description,
          ['imageUrl' as any]: imageUrl,
          status: status || 'WIP',
          userId: Number(userId),
        } as any,
      });

      await this.linkTagsToProject(tx, project.id, tags);
      return project;
    });
  }

  async getAllProjects(userId?: number) {
    const filter: any = {};
    if (userId) filter.userId = Number(userId);

    return this.prisma.project.findMany({
      where: filter,
      include: { 
        modLogs: true, 
        tags: { include: { tag: true } } 
      } as any,
    });
  }

  async updateProject(projectId: number, loggedInUserId: number, body: any) {
    const { title, description, imageUrl, status, tags } = body;

    const project = await this.prisma.project.findUnique({ 
      where: { id: Number(projectId) } 
    });

    if (!project) {
      throw new NotFoundException('Project build profile not found');
    }

    if (Number(project.userId) !== Number(loggedInUserId)) {
      throw new ForbiddenException('Its not urs gng');
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (imageUrl !== undefined) updateData['imageUrl'] = imageUrl;

    return this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: Number(projectId) },
        data: updateData,
      });

      if (tags) {
        await (tx as any).projectTag.deleteMany({ where: { projectId: Number(projectId) } });
        await this.linkTagsToProject(tx, Number(projectId), tags);
      }

      return tx.project.findUnique({
        where: { id: Number(projectId) },
        include: { tags: { include: { tag: true } } } as any,
      });
    });
  }

  async deleteProject(projectId: number, loggedInUserId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: Number(projectId) },
    });

    if (!project) {
      throw new NotFoundException('Project build profile not found');
    }

    if (Number(project.userId) !== Number(loggedInUserId)) {
      throw new ForbiddenException('You do not have permission to delete this project!');
    }

    return this.prisma.project.delete({
      where: { id: Number(projectId) },
    });
  }

  async addTimelineLog(userId: number, projectId: number, body: any) {
    const { title, description, cost, imageUrl } = body;
    const modCost = Number(cost || 0);

    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: Number(projectId) } }),
      this.prisma.user.findUnique({ where: { id: Number(userId) } }),
    ]);

    if (!project || Number(project.userId) !== Number(userId)) {
      throw new NotFoundException('Project build profile not found');
    }
    if (!user) throw new NotFoundException('User profile not found');

    if (Number(user.wallet) < modCost) {
      throw new BadRequestException(`Insufficient funds! This mod costs $${modCost.toFixed(2)}, but you only have $${Number(user.wallet).toFixed(2)}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: Number(userId) },
        data: { wallet: { decrement: modCost } },
      });

      const logEntry = await (tx as any).modLog.create({
        data: {
          logName: title,
          cost: modCost,
          projectId: Number(projectId),
          description,
          ['imageUrl' as any]: imageUrl,
        } as any,
      });

      const newTotalSpent = Number(project.totalSpent) + modCost;
      await tx.project.update({
        where: { id: Number(projectId) },
        data: { totalSpent: newTotalSpent },
      });

      return { success: true, updatedTotalSpent: newTotalSpent, logEntry };
    });
  }

  async updateTimelineLog(userId: number, logId: number, body: any) {
    const log = await (this.prisma as any).modLog.findUnique({
      where: { id: Number(logId) },
      include: { project: true },
    });
    if (!log || Number(log.project.userId) !== Number(userId)) throw new NotFoundException('Timeline entry not found');

    const user = await this.prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) throw new NotFoundException('User profile not found');

    const oldCost = Number(log.cost);
    const newCost = Number(body.cost ?? oldCost);
    const costDifference = newCost - oldCost;

    if (costDifference > 0 && Number(user.wallet) < costDifference) {
      throw new BadRequestException(`Insufficient funds to upgrade this log! Need an additional $${costDifference.toFixed(2)}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: Number(userId) },
        data: { wallet: { decrement: costDifference } },
      });

      const updatedLog = await (tx as any).modLog.update({
        where: { id: Number(logId) },
        data: {
          logName: body.title,
          description: body.description,
          cost: newCost,
          ['imageUrl' as any]: body.imageUrl,
        } as any,
      });

      await tx.project.update({
        where: { id: Number(log.projectId) },
        data: { totalSpent: Number(log.project.totalSpent) + costDifference },
      });

      return updatedLog;
    });
  }

  async deleteTimelineLog(userId: number, logId: number) {
    const log = await (this.prisma as any).modLog.findUnique({
      where: { id: Number(logId) },
      include: { project: true },
    });
    if (!log || Number(log.project.userId) !== Number(userId)) throw new NotFoundException('Timeline entry not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: Number(userId) },
        data: { wallet: { increment: Number(log.cost) } },
      });

      await tx.project.update({
        where: { id: Number(log.projectId) },
        data: { totalSpent: Number(log.project.totalSpent) - Number(log.cost) },
      });

      await (tx as any).modLog.delete({ where: { id: Number(logId) } });
      return { success: true, message: 'Timeline modification log wiped and cost refunded successfully' };
    });
  }

  async getUserDashboardMetrics(userId: number) {
    const cleanId = Number(userId);

    const totalProjects = await this.prisma.project.count({
      where: { userId: cleanId }
    });

    const userProjects = await this.prisma.project.findMany({
      where: { userId: cleanId },
      select: { totalSpent: true }
    });

    const totalInvestment = userProjects.reduce((sum, p) => sum + Number(p.totalSpent), 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUpdatesCount = await (this.prisma as any).modLog.count({
      where: {
        project: { userId: cleanId },
        createdAt: { gte: sevenDaysAgo }
      }
    });

    return {
      totalProjects,
      totalInvestment,
      recentUpdatesCount
    };
  }

  async getRecentActivityFeed() {
    return (this.prisma as any).modLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { title: true, user: { select: { email: true } } }
        }
      }
    });
  }
}