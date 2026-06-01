import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // --- SHOP ENDPOINTS ---
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

// --- TAG PROCESSING HELPER UTILITY ---
private async linkTagsToProject(tx: any, projectId: number, tags: string[]) {
  if (!tags || tags.length === 0) return;

  for (const tagName of tags) {
    // 1. Create tag if it doesn't exist, or grab it if it does
    const tag = await tx.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });

    // 2. Cast tx as any right here to completely shatter the compiler error
    await (tx as any).projectTag.create({
      data: { 
        projectId: Number(projectId), 
        tagId: Number(tag.id) 
      },
    });
  }
}

  // --- POST PROJECT ---
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

  // --- PUT UPDATE PROJECT & EDIT TAGS ---
  async updateProject(userId: number, projectId: number, body: any) {
    const { title, description, imageUrl, status, tags } = body;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) throw new NotFoundException('Project build profile not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update project specifications text fields
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          ['imageUrl' as any]: imageUrl,
          status,
        } as any,
      });

      // 2. If tags array is passed, clear old connections and overwrite with new layout map
      if (tags) {
        await (tx as any).projectTag.deleteMany({ where: { projectId } });
        await this.linkTagsToProject(tx, projectId, tags);
      }

      return tx.project.findUnique({
        where: { id: projectId },
        include: { tags: { include: { tag: true } } } as any,
      });
    });
  }

  // --- DELETE PROJECT ---
  async deleteProject(userId: number, projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) throw new NotFoundException('Project build profile not found');

    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true, message: 'Project profile deleted completely' };
  }

  // --- TIMELINE OPERATIONS ---
  async addTimelineLog(userId: number, projectId: number, body: any) {
    const { title, description, cost, imageUrl } = body;
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== userId) throw new NotFoundException('Project build profile not found');

    const modCost = Number(cost || 0);

    const logEntry = await (this.prisma as any).modLog.create({
      data: {
        logName: title,
        cost: modCost,
        projectId,
        description,
        ['imageUrl' as any]: imageUrl,
      } as any,
    });

    const newTotalSpent = Number(project.totalSpent) + modCost;
    await this.prisma.project.update({
      where: { id: projectId },
      data: { totalSpent: newTotalSpent },
    });

    return { success: true, updatedTotalSpent: newTotalSpent, logEntry };
  }

  async updateTimelineLog(userId: number, logId: number, body: any) {
    const log = await (this.prisma as any).modLog.findUnique({
      where: { id: logId },
      include: { project: true },
    });
    if (!log || log.project.userId !== userId) throw new NotFoundException('Timeline entry not found');

    const oldCost = Number(log.cost);
    const newCost = Number(body.cost ?? oldCost);

    const updatedLog = await (this.prisma as any).modLog.update({
      where: { id: logId },
      data: {
        logName: body.title,
        description: body.description,
        cost: newCost,
        ['imageUrl' as any]: body.imageUrl,
      } as any,
    });

    const costDifference = newCost - oldCost;
    await this.prisma.project.update({
      where: { id: log.projectId },
      data: { totalSpent: Number(log.project.totalSpent) + costDifference },
    });

    return updatedLog;
  }

  async deleteTimelineLog(userId: number, logId: number) {
    const log = await (this.prisma as any).modLog.findUnique({
      where: { id: logId },
      include: { project: true },
    });
    if (!log || log.project.userId !== userId) throw new NotFoundException('Timeline entry not found');

    await this.prisma.project.update({
      where: { id: log.projectId },
      data: { totalSpent: Number(log.project.totalSpent) - Number(log.cost) },
    });

    await (this.prisma as any).modLog.delete({ where: { id: logId } });
    return { success: true, message: 'Timeline modification log wiped successfully' };
  }
  // --- NEW: FETCH USER DASHBOARD COUNTERS & INSIGHT METRICS ---
  async getUserDashboardMetrics(userId: number) {
    const cleanId = Number(userId);

    // 1. Compute total counts
    const totalProjects = await this.prisma.project.count({
      where: { userId: cleanId }
    });

    // 2. Fetch projects to calculate global aggregated investment math statistics
    const userProjects = await this.prisma.project.findMany({
      where: { userId: cleanId },
      select: { totalSpent: true }
    });

    const totalInvestment = userProjects.reduce((sum, p) => sum + Number(p.totalSpent), 0);

    // 3. Count recent modification actions submitted in the last 7 days
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

  // --- NEW: SYSTEM-WIDE GLOBAL FEED FOR THE RECENT ACTIVITY BLOCK ---
  async getRecentActivityFeed() {
    // Fetches the top 5 newest timeline logs posted across all platform users
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