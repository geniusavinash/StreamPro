<?php

declare(strict_types=1);

namespace CameraStreaming\Models;

use DateTime;

/**
 * User model.
 */
class User
{
    public function __construct(
        public readonly string $id,
        public readonly string $username,
        public readonly string $email,
        public readonly string $role,
        public readonly bool $isActive,
        public readonly DateTime $createdAt,
        public readonly DateTime $updatedAt
    ) {
    }

    /**
     * Create User instance from array data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            username: $data['username'],
            email: $data['email'],
            role: $data['role'],
            isActive: $data['isActive'],
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
            'username' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'isActive' => $this->isActive,
            'createdAt' => $this->createdAt->format('c'),
            'updatedAt' => $this->updatedAt->format('c'),
        ];
    }
}