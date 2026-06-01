import { Controller, Post, Get, Put, Delete, Body, UseGuards, Req, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTimelineDto } from './dto/create-timeline.dto';

@ApiTags('Project Forum & Marketplace System')
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // --- SHOP ENDPOINTS ---
  @Post('market/listings')
  @ApiOperation({ summary: 'Create a new catalog item listing to populate the marketplace' })
  async createListing(@Body() body: { name: string; price: number }) {
    return this.projectsService.createPartListing(body);
  }

  @Get('market/listings')
  @ApiOperation({ summary: 'See what upgrade part gear is listed for purchase' })
  async getListings() {
    return this.projectsService.getMarketplaceListings();
  }

  // --- CAR BUILD ENDPOINTS ---
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new car build forum thread' })
  async createProject(@Req() req: any, @Body() body: CreateProjectDto) {
    return this.projectsService.createProject(req.user.userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'View builds (Optional filter by userId)' })
  @ApiQuery({ name: 'userId', required: false })
  async getForumFeed(@Query('userId') userId?: number) {
    return this.projectsService.getAllProjects(userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your project thread details' })
  async updateProj(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateProjectDto) {
    return this.projectsService.updateProject(req.user.userId, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your project thread completely' })
  async deleteProj(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.deleteProject(req.user.userId, id);
  }

  // --- LOG TIMELINE ENDPOINTS ---
  @Post(':id/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a new chronological mod log entry' })
  async addTimeline(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateTimelineDto) {
    return this.projectsService.addTimelineLog(req.user.userId, id, body);
  }

  @Put('timeline/:logId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modify an existing timeline entry' })
  async updateTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number, @Body() body: CreateTimelineDto) {
    return this.projectsService.updateTimelineLog(req.user.userId, logId, body);
  }

  @Delete('timeline/:logId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Wipe out a specific timeline log' })
  async deleteTimeline(@Req() req: any, @Param('logId', ParseIntPipe) logId: number) {
    return this.projectsService.deleteTimelineLog(req.user.userId, logId);
  }
  
  @Get('dashboard/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dashboard View: Fetch Total Projects, Investments, and Activity stats counters' })
  async getMetrics(@Req() req: any) {
    return this.projectsService.getUserDashboardMetrics(req.user.userId);
  }

  @Get('dashboard/activity-feed')
  @ApiOperation({ summary: 'Dashboard View: Fetch the latest 5 timeline updates posted on the network' })
  async getActivityFeed() {
    return this.projectsService.getRecentActivityFeed();
  }
}