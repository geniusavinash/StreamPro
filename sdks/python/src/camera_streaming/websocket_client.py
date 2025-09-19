"""
WebSocket client for real-time updates from the Camera Streaming Platform.
"""

import asyncio
import json
import logging
from typing import Any, Callable, Dict, List, Optional, Set
from urllib.parse import urljoin

import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException

from .exceptions import WebSocketError
from .models import AlertNotification, CameraStatusUpdate, DashboardUpdate, WebSocketMessage

logger = logging.getLogger(__name__)


class WebSocketClient:
    """
    WebSocket client for real-time updates from the Camera Streaming Platform.
    
    Example:
        >>> ws_client = WebSocketClient("wss://api.camera-streaming.example.com/ws", "your-jwt-token")
        >>> await ws_client.connect()
        >>> ws_client.subscribe_to_camera_updates()
        >>> ws_client.on("cameraStatusUpdate", lambda update: print(f"Camera {update.camera_id}: {update.status}"))
    """

    def __init__(
        self,
        url: str,
        token: str,
        reconnect: bool = True,
        reconnect_interval: float = 5.0,
        max_reconnect_attempts: int = 10,
    ):
        """
        Initialize the WebSocket client.
        
        Args:
            url: WebSocket URL
            token: JWT token for authentication
            reconnect: Whether to auto-reconnect on disconnect
            reconnect_interval: Interval between reconnect attempts in seconds
            max_reconnect_attempts: Maximum number of reconnect attempts
        """
        self.url = url
        self.token = token
        self.reconnect = reconnect
        self.reconnect_interval = reconnect_interval
        self.max_reconnect_attempts = max_reconnect_attempts
        
        self._websocket: Optional[websockets.WebSocketServerProtocol] = None
        self._event_handlers: Dict[str, List[Callable]] = {}
        self._subscriptions: Set[str] = set()
        self._reconnect_attempts = 0
        self._is_connected = False
        self._should_reconnect = True
        self._listen_task: Optional[asyncio.Task] = None

    async def connect(self) -> None:
        """
        Connect to the WebSocket server.
        
        Raises:
            WebSocketError: On connection failure
        """
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            self._websocket = await websockets.connect(self.url, extra_headers=headers)
            self._is_connected = True
            self._reconnect_attempts = 0
            
            # Start listening for messages
            self._listen_task = asyncio.create_task(self._listen())
            
            # Emit connected event
            await self._emit_event("connected", {})
            
            logger.info("WebSocket connected successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            raise WebSocketError(f"Connection failed: {str(e)}")

    async def disconnect(self) -> None:
        """Disconnect from the WebSocket server."""
        self._should_reconnect = False
        self._is_connected = False
        
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        
        if self._websocket:
            await self._websocket.close()
            self._websocket = None
        
        await self._emit_event("disconnected", {"code": 1000, "reason": "Client disconnect"})
        logger.info("WebSocket disconnected")

    async def _listen(self) -> None:
        """Listen for incoming WebSocket messages."""
        try:
            async for message in self._websocket:
                try:
                    data = json.loads(message)
                    await self._handle_message(data)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse WebSocket message: {message}")
                except Exception as e:
                    logger.error(f"Error handling WebSocket message: {e}")
                    await self._emit_event("error", {"message": str(e)})
                    
        except ConnectionClosed as e:
            logger.warning(f"WebSocket connection closed: {e}")
            self._is_connected = False
            
            if self._should_reconnect and self.reconnect:
                await self._attempt_reconnect()
            else:
                await self._emit_event("disconnected", {"code": e.code, "reason": e.reason})
                
        except WebSocketException as e:
            logger.error(f"WebSocket error: {e}")
            self._is_connected = False
            await self._emit_event("error", {"message": str(e)})
            
            if self._should_reconnect and self.reconnect:
                await self._attempt_reconnect()

    async def _attempt_reconnect(self) -> None:
        """Attempt to reconnect to the WebSocket server."""
        if self._reconnect_attempts >= self.max_reconnect_attempts:
            logger.error("Max reconnect attempts reached")
            await self._emit_event("error", {"message": "Max reconnect attempts reached"})
            return
        
        self._reconnect_attempts += 1
        await self._emit_event("reconnecting", {"attempt": self._reconnect_attempts})
        
        logger.info(f"Attempting to reconnect... (attempt {self._reconnect_attempts})")
        
        await asyncio.sleep(self.reconnect_interval)
        
        try:
            await self.connect()
            
            # Re-subscribe to previous subscriptions
            for subscription in self._subscriptions.copy():
                await self._send_message({"type": "subscribe", "data": {"topic": subscription}})
                
        except Exception as e:
            logger.error(f"Reconnect attempt {self._reconnect_attempts} failed: {e}")
            await self._attempt_reconnect()

    async def _handle_message(self, data: Dict[str, Any]) -> None:
        """Handle incoming WebSocket messages."""
        message_type = data.get("type")
        message_data = data.get("data", {})
        
        if message_type == "cameraStatusUpdate":
            update = CameraStatusUpdate(**message_data)
            await self._emit_event("cameraStatusUpdate", update)
            
        elif message_type == "dashboardUpdate":
            update = DashboardUpdate(**message_data)
            await self._emit_event("dashboardUpdate", update)
            
        elif message_type == "alert":
            alert = AlertNotification(**message_data)
            await self._emit_event("alert", alert)
            
        elif message_type == "streamQualityUpdate":
            await self._emit_event("streamQualityUpdate", message_data)
            
        elif message_type == "recordingEvent":
            await self._emit_event("recordingEvent", message_data)
            
        elif message_type == "error":
            await self._emit_event("error", message_data)
            
        else:
            # Generic message handling
            await self._emit_event(message_type, message_data)

    async def _send_message(self, message: Dict[str, Any]) -> None:
        """
        Send a message to the WebSocket server.
        
        Args:
            message: Message to send
            
        Raises:
            WebSocketError: If not connected or send fails
        """
        if not self._is_connected or not self._websocket:
            raise WebSocketError("WebSocket is not connected")
        
        try:
            await self._websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send WebSocket message: {e}")
            raise WebSocketError(f"Failed to send message: {str(e)}")

    async def _emit_event(self, event_type: str, data: Any) -> None:
        """Emit an event to registered handlers."""
        handlers = self._event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(data)
                else:
                    handler(data)
            except Exception as e:
                logger.error(f"Error in event handler for {event_type}: {e}")

    # Event handling methods
    def on(self, event_type: str, handler: Callable) -> None:
        """
        Register an event handler.
        
        Args:
            event_type: Type of event to listen for
            handler: Handler function (can be sync or async)
        """
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)

    def off(self, event_type: str, handler: Optional[Callable] = None) -> None:
        """
        Remove an event handler.
        
        Args:
            event_type: Type of event
            handler: Specific handler to remove (if None, removes all handlers for the event)
        """
        if event_type in self._event_handlers:
            if handler is None:
                del self._event_handlers[event_type]
            else:
                self._event_handlers[event_type] = [
                    h for h in self._event_handlers[event_type] if h != handler
                ]

    # Subscription methods
    async def subscribe_to_camera_updates(self) -> None:
        """Subscribe to all camera status updates."""
        await self._subscribe("camera_updates")

    async def subscribe_to_camera(self, camera_id: str) -> None:
        """
        Subscribe to updates for a specific camera.
        
        Args:
            camera_id: Camera ID to subscribe to
        """
        await self._subscribe(f"camera_{camera_id}")

    async def subscribe_to_dashboard(self) -> None:
        """Subscribe to dashboard updates."""
        await self._subscribe("dashboard")

    async def subscribe_to_alerts(self) -> None:
        """Subscribe to alert notifications."""
        await self._subscribe("alerts")

    async def unsubscribe_from_camera(self, camera_id: str) -> None:
        """
        Unsubscribe from updates for a specific camera.
        
        Args:
            camera_id: Camera ID to unsubscribe from
        """
        await self._unsubscribe(f"camera_{camera_id}")

    async def unsubscribe_from_all(self) -> None:
        """Unsubscribe from all topics."""
        for subscription in self._subscriptions.copy():
            await self._unsubscribe(subscription)

    async def _subscribe(self, topic: str) -> None:
        """
        Subscribe to a topic.
        
        Args:
            topic: Topic to subscribe to
        """
        if not self._is_connected:
            raise WebSocketError("WebSocket is not connected")
        
        message = {
            "type": "subscribe",
            "data": {"topic": topic}
        }
        
        await self._send_message(message)
        self._subscriptions.add(topic)
        logger.debug(f"Subscribed to topic: {topic}")

    async def _unsubscribe(self, topic: str) -> None:
        """
        Unsubscribe from a topic.
        
        Args:
            topic: Topic to unsubscribe from
        """
        if not self._is_connected:
            raise WebSocketError("WebSocket is not connected")
        
        message = {
            "type": "unsubscribe",
            "data": {"topic": topic}
        }
        
        await self._send_message(message)
        self._subscriptions.discard(topic)
        logger.debug(f"Unsubscribed from topic: {topic}")

    # Utility methods
    def is_connected(self) -> bool:
        """Check if the WebSocket is connected."""
        return self._is_connected

    def get_subscriptions(self) -> Set[str]:
        """Get current subscriptions."""
        return self._subscriptions.copy()

    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()