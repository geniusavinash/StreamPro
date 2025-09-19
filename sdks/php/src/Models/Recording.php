<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

use DateTime;

/**
 * Recording model.
 */
class Recording
{
    public function __construct(
        public readonly string $id,
        public readonly Camera $camera,
        public readonly string $filename,
        public readonly string $filePath,
        public readonly int $fileSize,
        public readonly int $duration,
        public readonly DateTime $startTime,
        public readonly DateTime $endTime,
        public readonly string $storageTier,
        public readonly bool $isEncrypted,
        public readonly DateTime $createdAt,
        public readonly DateTime $updatedAt
    ) {
    }

    /**
     * Create Recording instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            camera: Camera::fromArray($data['camera']),
            filename: $data['filename'],
            filePath: $data['filePath'],
            fileSize: $data['fileSize'],
            duration: $data['duration'],
            startTime: new DateTime($data['startTime']),
            endTime: new DateTime($data['endTime']),
            storageTier: $data['storageTier'],
            isEncrypted: $data['isEncrypted'],
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
            'camera' => $this->camera->toArray(),
            'filename' => $this->filename,
            'filePath' => $this->filePath,
            'fileSize' => $this->fileSize,
            'duration' => $this->duration,
            'startTime' => $this->startTime->format('c'),
            'endTime' => $this->endTime->format('c'),
            'storageTier' => $this->storageTier,
            'isEncrypted' => $this->isEncrypted,
            'createdAt' => $this->createdAt->format('c'),
            'updatedAt' => $this->updatedAt->format('c'),
        ];
    }
}