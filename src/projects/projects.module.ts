import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from '../auth/auth.module'; // Import Auth Layout

@Module({
  imports: [AuthModule], // Injects JWT mechanics into the Guard
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}