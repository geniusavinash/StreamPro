import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // Streaming base URLs used for RTMP publish and HLS playback
  rtmpBaseUrl: process.env.RTMP_BASE_URL || 'rtmp://api.getfairplay.org:1935/live',
  hlsBaseUrl: process.env.HLS_BASE_URL || 'https://api.getfairplay.org/hls',
  // FFmpeg binary path (set to full path on Windows like C:\\ffmpeg\\bin\\ffmpeg.exe)
  ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
}));