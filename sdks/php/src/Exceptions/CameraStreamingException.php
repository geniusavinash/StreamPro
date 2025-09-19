<?php

declare(strict_types=1);

namespace CameraStreaming\Exceptions;

use Exception;

/**
 * Base exception for Camera Streaming SDK.
 */
class CameraStreamingException extends Exception
{
    public function __construct(string $message, int $statusCode = 0)
    {
        parent::__construct($message, $statusCode);
    }
}