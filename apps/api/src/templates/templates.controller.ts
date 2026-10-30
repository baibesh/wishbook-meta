import { Controller, Get, Param } from '@nestjs/common';
import type { Template, TemplateSummary } from '@fabulka/shared';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(): Promise<TemplateSummary[]> {
    return this.templates.list();
  }

  @Get(':slug')
  get(@Param('slug') slug: string): Promise<Template> {
    return this.templates.get(slug);
  }
}
