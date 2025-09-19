<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

/**
 * System health model.
 */
class SystemHealth
{
    public function __construct(
        public readonly string $status,
        public readonly int $uptime,
        public readonly string $version,
        public readonly array $services
    ) {
    }

    /**
     * Create SystemHealth instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            status: $data['status'],
            uptime: $data['uptime'],
            version: $data['version'],
            services: $data['services']
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'uptime' => $this->uptime,
            'version' => $this->version,
            'services' => $this->services,
        ];
    }
}