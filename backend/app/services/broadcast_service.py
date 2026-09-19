import json
from typing import Set

from starlette.websockets import (
    WebSocket,
    WebSocketDisconnect,
)


class WebBroadcastManager:

    def __init__(self):
        self.connections: Set[WebSocket] = set()

    # ============================================================
    # CONNECT
    # ============================================================

    async def connect(
        self,
        websocket: WebSocket,
    ):
        """
        Accept and register a WebSocket client.
        """

        await websocket.accept()

        self.connections.add(websocket)

        print(
            "✅ WebBroadcastManager: connection accepted"
        )

        print(
            "📡 Active connections:",
            self.active_connections
        )

    # ============================================================
    # DISCONNECT
    # ============================================================

    def disconnect(
        self,
        websocket: WebSocket,
    ):
        """
        Remove a WebSocket client safely.
        """

        self.connections.discard(websocket)

        print(
            "👋 WebBroadcastManager: connection removed"
        )

        print(
            "📡 Active connections:",
            self.active_connections
        )

    # ============================================================
    # ACTIVE CONNECTION COUNT
    # ============================================================

    @property
    def active_connections(self) -> int:
        return len(self.connections)

    # ============================================================
    # BROADCAST
    # ============================================================

    async def broadcast(
        self,
        payload: dict,
    ) -> int:

        message = json.dumps(
            payload,
            default=str,
        )

        stale = []

        delivered = 0

        # --------------------------------------------------------
        # SEND TO ALL CONNECTED CLIENTS
        # --------------------------------------------------------

        for websocket in list(
            self.connections
        ):

            try:

                await websocket.send_text(
                    message
                )

                delivered += 1

            except (
                WebSocketDisconnect,
                RuntimeError,
            ) as error:

                print(
                    "⚠️ Removing stale WebSocket:",
                    repr(error)
                )

                stale.append(
                    websocket
                )

            except Exception as error:

                print(
                    "❌ WebSocket broadcast error:",
                    repr(error)
                )

                stale.append(
                    websocket
                )

        # --------------------------------------------------------
        # REMOVE DEAD CONNECTIONS
        # --------------------------------------------------------

        for websocket in stale:

            self.disconnect(
                websocket
            )

        print(
            "📢 Broadcast delivered to",
            delivered,
            "clients"
        )

        return delivered


# ================================================================
# SINGLE GLOBAL MANAGER
# ================================================================

broadcast_manager = WebBroadcastManager()