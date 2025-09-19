<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

use DateTime;

/**
 * API Token model.
 */
class ApiToken
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly array $permissions,
        public readonly bool $isActive,
        public readonly ?DateTime $expiresAt,
        public readonly ?DateTime $lastUsedAt,
        public readonly array $ipWhitelist,
        public readonly int $rateLimit,
        public readonly DateTime $createdAt,
        public readonly DateTime $updatedAt
    ) {
    }

    /**
     * Create ApiToken instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            permissions: $data['permissions'],
            isActive: $data['isActive'],
            expiresAt: $data['expiresAt'] ? new DateTime($data['expiresAt']) : null,
            lastUsedAt: $data['lastUsedAt'] ? new DateTime($data['lastUsedAt']) : null,
            ipWhitelist: $data['ipWhitelist'],
            rateLimit: $data['rateLimit'],
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
            'permissions' => $this->permissions,
            'isActive' => $this->isActive,
            'expiresAt' => $this->expiresAt?->format('c'),
            'lastUsedAt' => $this->lastUsedAt?->format('c'),
            'ipWhitelist' => $this->ipWhitelist,
            'rateLimit' => $this->rateLimit,
            'createdAt' => $this->createdAt->format('c'),
            'updatedAt' => $this->updatedAt->format('c'),
        ];
    }
}