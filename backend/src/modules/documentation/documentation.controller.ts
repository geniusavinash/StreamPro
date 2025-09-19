import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentationService } from './documentation.service';

@ApiTags('documentation')
@Controller('docs')
export class DocumentationController {
  constructor(private readonly documentationService: DocumentationService) {}

  @Get('openapi.json')
  @ApiExcludeEndpoint()
  async getOpenApiSpec(@Res() res: Response) {
    const spec = await this.documentationService.generateOpenApiSpec();
    res.json(spec);
  }

  @Get('postman')
  @ApiOperation({ summary: 'Download Postman collection' })
  @ApiResponse({ status: 200, description: 'Postman collection downloaded successfully' })
  async getPostmanCollection(@Res() res: Response) {
    const collection = await this.documentationService.generatePostmanCollection();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="camera-platform-api.postman_collection.json"');
    res.json(collection);
  }

  @Get('sdk/javascript')
  @ApiOperation({ summary: 'Download JavaScript SDK' })
  @ApiResponse({ status: 200, description: 'JavaScript SDK downloaded successfully' })
  async getJavaScriptSDK(@Res() res: Response) {
    const sdk = await this.documentationService.generateJavaScriptSDK();
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', 'attachment; filename="camera-platform-sdk.js"');
    res.send(sdk);
  }

  @Get('sdk/python')
  @ApiOperation({ summary: 'Download Python SDK' })
  @ApiResponse({ status: 200, description: 'Python SDK downloaded successfully' })
  async getPythonSDK(@Res() res: Response) {
    const sdk = await this.documentationService.generatePythonSDK();
    res.setHeader('Content-Type', 'text/x-python');
    res.setHeader('Content-Disposition', 'attachment; filename="camera_platform_sdk.py"');
    res.send(sdk);
  }

  @Get('examples')
  @ApiOperation({ summary: 'Get API usage examples' })
  @ApiResponse({ status: 200, description: 'API examples retrieved successfully' })
  async getApiExamples() {
    return this.documentationService.getApiExamples();
  }

  @Get('changelog')
  @ApiOperation({ summary: 'Get API changelog' })
  @ApiResponse({ status: 200, description: 'API changelog retrieved successfully' })
  async getChangelog() {
    return this.documentationService.getChangelog();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get API status and health' })
  @ApiResponse({ status: 200, description: 'API status retrieved successfully' })
  async getApiStatus() {
    return this.documentationService.getApiStatus();
  }
}