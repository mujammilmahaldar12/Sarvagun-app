/**
 * Real-time WebSocket Service Configuration
 * Setup instructions and utilities for Django backend
 */

# WebSocket Backend Setup Guide

## Prerequisites
- Django REST Framework
- Django Channels (for WebSocket support)
- Redis (for channel layers)

## Installation

```bash
pip install channels channels-redis daphne
```

## Django Settings Configuration

Add to `settings.py`:

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'daphne',  # Add at the top
    'django.contrib.admin',
    'django.contrib.auth',
    # ... other apps ...
    'channels',
]

# ASGI Application
ASGI_APPLICATION = 'sarvagun.asgi.application'

# Channel Layers (using Redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

## ASGI Configuration

Create or update `asgi.py`:

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sarvagun.settings')

django_asgi_app = get_asgi_application()

from realtime import routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                routing.websocket_urlpatterns
            )
        )
    ),
})
```

## WebSocket Consumer

Create `realtime/consumers.py`:

```python
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User

class CollaborationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user_group_name = f'user_{self.user_id}'
        
        # Join user's personal group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Broadcast user joined
        await self.channel_layer.group_send(
            'all_users',
            {
                'type': 'user_presence',
                'user_id': self.user_id,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        # Leave user's group
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
        
        # Broadcast user left
        await self.channel_layer.group_send(
            'all_users',
            {
                'type': 'user_presence',
                'user_id': self.user_id,
                'status': 'offline'
            }
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
        
        elif message_type == 'presence_update':
            await self.broadcast_presence(data)
        
        elif message_type == 'user_typing':
            await self.broadcast_typing(data)
        
        elif message_type == 'user_stopped_typing':
            await self.broadcast_stop_typing(data)
        
        elif message_type == 'user_joined':
            await self.handle_room_join(data)
        
        elif message_type == 'user_left':
            await self.handle_room_leave(data)
        
        elif message_type in ['task_updated', 'project_updated', 'comment_added']:
            await self.broadcast_update(data)

    async def broadcast_presence(self, data):
        await self.channel_layer.group_send(
            'all_users',
            {
                'type': 'user_presence',
                'user_id': self.user_id,
                'status': data['payload']['status'],
                'current_screen': data['payload'].get('currentScreen')
            }
        )

    async def broadcast_typing(self, data):
        room_id = data['payload']['contextId']
        await self.channel_layer.group_send(
            f'room_{room_id}',
            {
                'type': 'typing_indicator',
                'user_id': self.user_id,
                'context_id': room_id,
                'context_type': data['payload']['contextType'],
                'is_typing': True
            }
        )

    async def broadcast_stop_typing(self, data):
        room_id = data['payload']['contextId']
        await self.channel_layer.group_send(
            f'room_{room_id}',
            {
                'type': 'typing_indicator',
                'user_id': self.user_id,
                'context_id': room_id,
                'is_typing': False
            }
        )

    async def handle_room_join(self, data):
        room_id = data['payload']['roomId']
        await self.channel_layer.group_add(
            f'room_{room_id}',
            self.channel_name
        )
        await self.channel_layer.group_send(
            f'room_{room_id}',
            {
                'type': 'user_room_action',
                'action': 'joined',
                'user_id': self.user_id,
                'room_id': room_id
            }
        )

    async def handle_room_leave(self, data):
        room_id = data['payload']['roomId']
        await self.channel_layer.group_discard(
            f'room_{room_id}',
            self.channel_name
        )
        await self.channel_layer.group_send(
            f'room_{room_id}',
            {
                'type': 'user_room_action',
                'action': 'left',
                'user_id': self.user_id,
                'room_id': room_id
            }
        )

    async def broadcast_update(self, data):
        entity_id = data['payload']['entityId']
        await self.channel_layer.group_send(
            f'entity_{entity_id}',
            {
                'type': 'entity_update',
                'entity_type': data['type'].replace('_updated', '').replace('_added', ''),
                'entity_id': entity_id,
                'data': data['payload']['data']
            }
        )

    # Handler methods for group messages
    async def user_presence(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence_update',
            'payload': {
                'userId': str(event['user_id']),
                'status': event['status'],
                'currentScreen': event.get('current_screen')
            }
        }))

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_typing' if event['is_typing'] else 'user_stopped_typing',
            'payload': {
                'userId': str(event['user_id']),
                'contextId': event['context_id'],
                'contextType': event.get('context_type')
            }
        }))

    async def user_room_action(self, event):
        await self.send(text_data=json.dumps({
            'type': f"user_{event['action']}",
            'payload': {
                'userId': str(event['user_id']),
                'roomId': event['room_id']
            }
        }))

    async def entity_update(self, event):
        await self.send(text_data=json.dumps({
            'type': f"{event['entity_type']}_updated",
            'payload': {
                'entityId': event['entity_id'],
                'data': event['data']
            }
        }))
```

## Routing Configuration

Create `realtime/routing.py`:

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/user/(?P<user_id>\w+)$', consumers.CollaborationConsumer.as_asgi()),
]
```

## Running the Server

Use Daphne instead of runserver for WebSocket support:

```bash
# Development
daphne -b 0.0.0.0 -p 8000 sarvagun.asgi:application

# Production (with systemd)
daphne -u /run/daphne.sock sarvagun.asgi:application
```

## Testing WebSocket Connection

```python
# Test script
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/user/123"
    
    async with websockets.connect(uri) as websocket:
        # Send presence update
        await websocket.send(json.dumps({
            'type': 'presence_update',
            'payload': {
                'status': 'online',
                'currentScreen': 'home'
            }
        }))
        
        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(test_websocket())
```

## Nginx Configuration (Production)

```nginx
upstream websocket_backend {
    server unix:/run/daphne.sock;
}

server {
    listen 80;
    server_name your-domain.com;

    location /ws/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://django_backend;
        # ... other Django settings ...
    }
}
```

## Environment Variables

Update `.env`:

```env
# WebSocket Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WEBSOCKET_ENABLED=True
```

## Notes

1. **Update WebSocket URL**: In `services/websocket.service.ts`, update the WebSocket URL to match your backend:
   ```typescript
   const WS_BASE_URL = 'ws://your-backend-url/ws';
   ```

2. **Authentication**: Add token-based authentication to WebSocket connections if needed

3. **Scaling**: For production, use Redis as a channel layer for horizontal scaling

4. **Monitoring**: Add logging and monitoring for WebSocket connections

5. **Testing**: Test WebSocket connection stability and reconnection logic
