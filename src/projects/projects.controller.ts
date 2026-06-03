import { Controller, Post, Get, Put, Delete, Body, UseGuards, Req, Param, ParseIntPipe, Query, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Project Forum & Marketplace System')
@Controller('projects')
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  // --- SHOP ENDPOINTS ---
  
  @Post('market/listings')
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- Enable guard security evaluation context
  @Roles('angelic goodest dogboyprincess', 'lobotomites') // <-- ONLY Admin or Mods can touch this
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new catalog item listing to populate the marketplace' })
  async createListing(@Body() body: { name: string; price: number }) {
    return this.projectsService.createPartListing(body);
  }

  @Get('market/listings')
  @ApiOperation({ summary: 'See what upgrade part gear is listed for purchase (Public Access)' })
  async getListings() {
    return this.projectsService.getMarketplaceListings();
  }

  // --- CAR BUILD ENDPOINTS ---
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- Guarded: Requires standard account user roles
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new car build forum thread' })
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject(req.user.userId, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) // <-- Guarded: View forum builds requires an account
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View builds (Optional filter by userId)' })
  @ApiQuery({ name: 'userId', required: false })
  async getForumFeed(@Query('userId') userId?: number) {
    return this.projectsService.getAllProjects(userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your project thread details' })
  async updateProj(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateProjectDto) {
  return this.projectsService.updateProject(id, req.user.userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your project thread completely' })
  async deleteProj(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
  return this.projectsService.deleteProject(id, req.user.userId);
  }

  // --- LOG TIMELINE ENDPOINTS ---
  
  @Post(':id/timeline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a new chronological mod log entry' })
  async addTimeline(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateTimelineDto) {
    return this.projectsService.addTimelineLog(req.user.userId, id, body);
  }

  @Put('timeline/:logId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modify an existing timeline entry' })
  async updateTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number, @Body() body: CreateTimelineDto) {
    return this.projectsService.updateTimelineLog(req.user.userId, logId, body);
  }

  @Delete('timeline/:logId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Wipe out a specific timeline log' })
  async deleteTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number) {
    return this.projectsService.deleteTimelineLog(req.user.userId, logId);
  }
  
  @Get('dashboard/metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard View: Fetch Total Projects, Investments, and Activity stats counters' })
  async getMetrics(@Req() req: any) {
    return this.projectsService.getUserDashboardMetrics(req.user.userId);
  }

  @Get('dashboard/activity-feed')
  @ApiOperation({ summary: 'Dashboard View: Fetch the latest 5 timeline updates posted on the network (Public Access)' })
  async getActivityFeed() {
    return this.projectsService.getRecentActivityFeed();
  }

  @Get('user/:username')
@ApiOperation({ summary: 'Public Route: Fetch all car builds belonging to a specific username handle' })
async getProjectsByUsername(@Param('username') username: string) {
  const userWithProjects = await this.prisma.user.findUnique({
    where: { username },
    select: {
      fullname: true, // <-- UPDATED: Changed from 'name' to match your schema's 'fullname'
      username: true,
      avatarUrl: true, // <-- OPTIONAL: Bringing this along so the UI can show their picture!
      projects: {
      }
    }
  });

  if (!userWithProjects) {
    throw new NotFoundException(`The user handle "${username}" does not exist`);
  }

  return userWithProjects;
}
}