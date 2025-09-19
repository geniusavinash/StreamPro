<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

/**
 * Dashboard statistics model.
 */
class DashboardStats
{
    public function __construct(
        public readonly int $totalCameras,
        public readonly int $onlineCameras,
        public readonly int $offlineCameras,
        public readonly int $recordingCameras,
        public readonly int $totalRecordings,
        public readonly int $totalStorage,
        public readonly int $activeStreams,
        public readonly string $systemHealth
    ) {
    }

    /**
     * Create DashboardStats instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            totalCameras: $data['totalCameras'],
            onlineCameras: $data['onlineCameras'],
            offlineCameras: $data['offlineCameras'],
            recordingCameras: $data['recordingCameras'],
            totalRecordings: $data['totalRecordings'],
            totalStorage: $data['totalStorage'],
            activeStreams: $data['activeStreams'],
            systemHealth: $data['systemHealth']
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'totalCameras' => $this->totalCameras,
            'onlineCameras' => $this->onlineCameras,
            'offlineCameras' => $this->offlineCameras,
            'recordingCameras' => $this->recordingCameras,
            'totalRecordings' => $this->totalRecordings,
            'totalStorage' => $this->totalStorage,
            'activeStreams' => $this->activeStreams,
            'systemHealth' => $this->systemHealth,
        ];
    }
}