import { Controller, Post, Get, Put, Delete, Body, UseGuards, Req, Param, ParseIntPipe, Query, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody, ApiProperty } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { PrismaService } from '../prisma/prisma.service';

class CreateListingDto {
  @ApiProperty({ example: 'Stage 3 Turbocharger' })
  name: string;
  @ApiProperty({ example: 4500 })
  price: number;
}

@ApiTags('Project Forum & Marketplace System')
@Controller('projects')
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  @Post('market/listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('angelic goodest dogboyprincess', 'lobotomites')
  @ApiBearerAuth()
  @ApiBody({ type: CreateListingDto })
  async createListing(@Body() body: CreateListingDto) {
    return this.projectsService.createPartListing(body);
  }

  @Get('market/listings')
  async getListings() {
    return this.projectsService.getMarketplaceListings();
  }

  @Post('market/purchase/:listingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async buyItem(@Req() req: any, @Param('listingId', ParseIntPipe) listingId: number) {
    return this.projectsService.purchaseMarketplaceItem(req.user.userId, listingId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject(req.user.userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'userId', required: false })
  async getForumFeed(@Query('userId') userId?: number) {
    return this.projectsService.getAllProjects(userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async updateProj(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateProjectDto) {
    return this.projectsService.updateProject(id, req.user.userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async deleteProj(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProject(id, req.user.userId);
  }

  @Post(':id/timeline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async addTimeline(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateTimelineDto) {
    // 💡 Explicit order: req.user.userId maps to userId, id maps to projectId
    return this.projectsService.addTimelineLog(req.user.userId, id, body);
  }

  @Put('timeline/:logId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async updateTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number, @Body() body: CreateTimelineDto) {
    return this.projectsService.updateTimelineLog(req.user.userId, logId, body);
  }

  @Delete('timeline/:logId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async deleteTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number) {
    return this.projectsService.deleteTimelineLog(req.user.userId, logId);
  }
  
  @Get('dashboard/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  async getMetrics(@Req() req: any) {
    return this.projectsService.getUserDashboardMetrics(req.user.userId);
  }

  @Get('dashboard/activity-feed')
  async getActivityFeed() {
    return this.projectsService.getRecentActivityFeed();
  }

  @Get('user/:username')
  async getProjectsByUsername(@Param('username') username: string) {
    const userWithProjects = await this.prisma.user.findUnique({
      where: { username },
      select: { fullname: true, username: true, avatarUrl: true, projects: true }
    });
    if (!userWithProjects) throw new NotFoundException(`The user handle "${username}" does not exist`);
    return userWithProjects;
  }
}