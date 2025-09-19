<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

/**
 * Analytics overview model.
 */
class AnalyticsOverview
{
    public function __construct(
        public readonly string $timeRange,
        public readonly array $metrics,
        public readonly array $trends
    ) {
    }

    /**
     * Create AnalyticsOverview instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            timeRange: $data['timeRange'],
            metrics: $data['metrics'],
            trends: $data['trends']
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'timeRange' => $this->timeRange,
            'metrics' => $this->metrics,
            'trends' => $this->trends,
        ];
    }
}