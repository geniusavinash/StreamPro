import { Controller, Post, Get, Req, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StreamingService } from './streaming.service';
import { Request, Response } from 'express';

@ApiTags('streaming')
@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Post('auth/publish')
  @ApiOperation({ summary: 'RTMP publish authentication' })
  @ApiResponse({ status: 200, description: 'Authentication result' })
  async authenticatePublish(@Req() req: Request, @Res() res: Response) {
    const { name: streamKey } = req.query;
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!streamKey || typeof streamKey !== 'string') {
      return res.status(401).json({ error: 'Stream key required' });
    }

    try {
      const isAuthenticated = await this.streamingService.authenticatePublish(streamKey, ip);
      
      if (isAuthenticated) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } catch (error) {
      console.error('Publish authentication error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('auth/play')
  @ApiOperation({ summary: 'RTMP play authentication' })
  @ApiResponse({ status: 200, description: 'Authentication result' })
  async authenticatePlay(@Req() req: Request, @Res() res: Response) {
    const { name: streamKey } = req.query;
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!streamKey || typeof streamKey !== 'string') {
      return res.status(401).json({ error: 'Stream key required' });
    }

    try {
      const isAuthenticated = await this.streamingService.authenticatePlay(streamKey, ip);
      
      if (isAuthenticated) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } catch (error) {
      console.error('Play authentication error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('events/publish_done')
  @ApiOperation({ summary: 'RTMP publish done event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handlePublishDone(@Req() req: Request, @Res() res: Response) {
    const { name: streamKey } = req.query;
    
    if (!streamKey || typeof streamKey !== 'string') {
      return res.status(400).json({ error: 'Stream key required' });
    }

    try {
      await this.streamingService.handlePublishDone(streamKey);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Publish done event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('events/play_done')
  @ApiOperation({ summary: 'RTMP play done event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handlePlayDone(@Req() req: Request, @Res() res: Response) {
    const { name: streamKey } = req.query;
    
    if (!streamKey || typeof streamKey !== 'string') {
      return res.status(400).json({ error: 'Stream key required' });
    }

    try {
      await this.streamingService.handlePlayDone(streamKey);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Play done event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('events/connect')
  @ApiOperation({ summary: 'RTMP connect event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleConnect(@Req() req: Request, @Res() res: Response) {
    const ip = req.ip || req.connection.remoteAddress;
    
    try {
      await this.streamingService.handleConnect(ip);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Connect event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('events/disconnect')
  @ApiOperation({ summary: 'RTMP disconnect event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleDisconnect(@Req() req: Request, @Res() res: Response) {
    const ip = req.ip || req.connection.remoteAddress;
    
    try {
      await this.streamingService.handleDisconnect(ip);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Disconnect event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  @Post('events/record_done')
  @ApiOperation({ summary: 'RTMP record done event' })
  @ApiResponse({ status: 200, description: 'Event processed' })
  async handleRecordDone(@Req() req: Request, @Res() res: Response) {
    const { name: streamKey, path: filePath } = req.query;
    
    if (!streamKey || typeof streamKey !== 'string') {
      return res.status(400).json({ error: 'Stream key required' });
    }

    try {
      await this.streamingService.handleRecordDone(streamKey, filePath as string);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Record done event error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}