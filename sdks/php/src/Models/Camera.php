<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

use DateTime;

/**
 * Camera model.
 */
class Camera
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $company,
        public readonly string $model,
        public readonly string $serialNumber,
        public readonly string $location,
        public readonly string $place,
        public readonly string $rtmpUrl,
        public readonly bool $isActive,
        public readonly bool $isRecording,
        public readonly string $streamStatus,
        public readonly DateTime $createdAt,
        public readonly DateTime $updatedAt
    ) {
    }

    /**
     * Create Camera instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            company: $data['company'],
            model: $data['model'],
            serialNumber: $data['serialNumber'],
            location: $data['location'],
            place: $data['place'],
            rtmpUrl: $data['rtmpUrl'],
            isActive: $data['isActive'],
            isRecording: $data['isRecording'],
            streamStatus: $data['streamStatus'],
            createdAt: new DateTime($data['createdAt']),
            updatedAt: new DateTime($data['updatedAt'])
        );
    }

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'company' => $this->company,
            'model' => $this->model,
            'serialNumber' => $this->serialNumber,
            'location' => $this->location,
            'place' => $this->place,
            'rtmpUrl' => $this->rtmpUrl,
            'isActive' => $this->isActive,
            'isRecording' => $this->isRecording,
            'streamStatus' => $this->streamStatus,
            'createdAt' => $this->createdAt->format('c'),
            'updatedAt' => $this->updatedAt->format('c'),
        ];
    }
}