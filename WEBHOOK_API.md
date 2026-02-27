# Webhook API Documentation

## Endpoints Overview

1. **Send Message**: POST `/api/webhooks/send-message` - Send chat messages to external webhook
2. **Receive Response**: POST/GET `/api/webhooks/receive-response` - Receive webhook responses
3. **Webhook Logs**: GET/DELETE `/api/webhooks/logs` - View and manage webhook logs
4. **Conversations**: POST/GET/DELETE `/api/webhooks/conversations` - Store and retrieve conversation history

---

## 1. Send Message Endpoint

This endpoint sends chat messages to a configured webhook service when users send messages through the chat interface.

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "clientId": "1",
  "clientName": "MCI PLUS",
  "clientEmail": "contact@mciplus.com.br",
  "clientPhone": "+55 41 99123-4567",
  "message": "Perfeito! Tudo funcionando normalmente.",
  "senderName": "Support Team",
  "sender": "support",
  "timestamp": "27/02/2026 14:30"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Message sent to webhook successfully",
  "data": {
    "clientId": "1",
    "clientName": "MCI PLUS",
    "senderName": "Support Team",
    "sender": "support",
    "timestamp": "27/02/2026 14:30"
  },
  "webhookResponse": {
    "status": "received",
    "id": "msg_123456"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Missing required fields: clientId, message, senderName, sender"
}
```

**No Webhook Configured (200):**
```json
{
  "success": true,
  "message": "Message received but no webhook configured",
  "data": {
    "clientId": "1",
    "clientName": "MCI PLUS",
    "senderName": "Support Team",
    "sender": "support",
    "timestamp": "27/02/2026 14:30"
  }
}
```

## Configuration

### Environment Variables

Set your webhook URL in `.env.local`:

```env
# Primary chat webhook
CHAT_WEBHOOK_URL=https://your-service.com/webhooks/chat

# Or use a generic webhook URL
WEBHOOK_URL=https://your-service.com/webhooks/events
```

The API checks `CHAT_WEBHOOK_URL` first, then falls back to `WEBHOOK_URL`.

If no webhook URL is configured, the API will accept the message but won't forward it to an external service.

## Webhook Payload Format

When the endpoint successfully posts to your webhook, it sends:

```json
{
  "event": "chat.message_sent",
  "timestamp": "2026-02-27T14:30:00.000Z",
  "data": {
    "clientId": "1",
    "clientName": "MCI PLUS",
    "clientEmail": "contact@mciplus.com.br",
    "clientPhone": "+55 41 99123-4567",
    "message": "Perfeito! Tudo funcionando normalmente.",
    "senderName": "Support Team",
    "sender": "support",
    "messageTimestamp": "27/02/2026 14:30"
  }
}
```

## Usage Example

### Client-Side (React)

The ClientChat component automatically calls this endpoint when a message is sent:

```typescript
const response = await fetch('/api/webhooks/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: '1',
    clientName: 'MCI PLUS',
    clientEmail: 'contact@mciplus.com.br',
    clientPhone: '+55 41 99123-4567',
    message: 'Your message here',
    senderName: 'Support Team',
    sender: 'support',
    timestamp: '27/02/2026 14:30',
  }),
});
```

### Webhook Handler Example (Node.js/Express)

```javascript
app.post('/webhooks/chat', (req, res) => {
  const { event, data } = req.body;

  if (event === 'chat.message_sent') {
    console.log(`Message from ${data.clientName}:`, data.message);
    
    // Store in database, send email, integrate with CRM, etc.
    saveMessageToDatabase(data);
    notifyCustomerSupport(data);
    
    res.json({ status: 'received', id: `msg_${Date.now()}` });
  }
});
```

### Webhook Handler Example (Python/FastAPI)

```python
from fastapi import FastAPI

app = FastAPI()

@app.post("/webhooks/chat")
async def receive_message(payload: dict):
    event = payload.get("event")
    data = payload.get("data")
    
    if event == "chat.message_sent":
        print(f"Message from {data['clientName']}: {data['message']}")
        
        # Store in database, send email, integrate with CRM, etc.
        save_message_to_database(data)
        notify_support_team(data)
        
        return {"status": "received", "id": f"msg_{int(time.time())}"}
```

## Error Handling

The API retries once on failure and includes error information in the response. If the webhook endpoint is unreachable or returns an error status, the message is still accepted by the dashboard (to prevent UX issues), but the webhook response will indicate the failure.

Check your server logs for more details about webhook delivery issues.

---

## 2. Receive Webhook Response Endpoint

This endpoint receives responses from your external webhook service and stores them for tracking and debugging.

### POST Request (Receive Response)

**Method:** `POST`

**Endpoint:** `/api/webhooks/receive-response`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "messageId": "msg_123456",
  "clientId": "1",
  "clientName": "MCI PLUS",
  "status": "processed",
  "response": {
    "ticketId": "TKT-12345",
    "assignedTo": "John Doe",
    "priority": "high",
    "estimatedResolution": "48 hours"
  },
  "timestamp": "27/02/2026 14:35",
  "source": "TicketingSystem"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webhook response received successfully",
  "responseId": "resp_1709000000000_abc123def",
  "data": {
    "clientId": "1",
    "clientName": "MCI PLUS",
    "status": "processed",
    "receivedAt": "2026-02-27T14:35:00.000Z"
  }
}
```

### GET Request (Retrieve Responses)

**Method:** `GET`

**Endpoint:** `/api/webhooks/receive-response`

**Query Parameters:**
- `clientId` (optional): Filter by client ID
- `source` (optional): Filter by source/service name
- `limit` (optional, default: 50): Number of responses to return

**Example:**
```
GET /api/webhooks/receive-response?clientId=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 10,
  "data": [
    {
      "id": "resp_1709000000000_abc123def",
      "receivedAt": "2026-02-27T14:35:00.000Z",
      "source": "TicketingSystem",
      "status": "received",
      "payload": {
        "messageId": "msg_123456",
        "clientId": "1",
        "clientName": "MCI PLUS",
        "response": { "ticketId": "TKT-12345" },
        "timestamp": "27/02/2026 14:35"
      }
    },
    {
      "id": "resp_1708999000000_xyz789",
      "receivedAt": "2026-02-27T14:30:00.000Z",
      "source": "NotificationService",
      "status": "received",
      "payload": { ... }
    }
  ]
}
```

---

## 3. Webhook Logs Endpoint

This endpoint provides comprehensive logging of all webhook activity for debugging and auditing.

### POST Request (Create Log Entry)

**Method:** `POST`

**Endpoint:** `/api/webhooks/logs`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "type": "sent",
  "clientId": "1",
  "clientName": "MCI PLUS",
  "endpoint": "https://external-service.com/webhooks/chat",
  "status": 200,
  "message": "Message successfully delivered"
}
```

Valid types: `sent`, `received`, `error`

**Response:**
```json
{
  "success": true,
  "message": "Log recorded successfully",
  "logId": "log_1709000000000_abc123def"
}
```

### GET Request (Retrieve Logs)

**Method:** `GET`

**Endpoint:** `/api/webhooks/logs`

**Query Parameters:**
- `type` (optional): Filter by type (`sent`, `received`, `error`)
- `clientId` (optional): Filter by client ID
- `endpoint` (optional): Filter by endpoint URL (partial match)
- `limit` (optional, default: 100): Number of logs per page
- `offset` (optional, default: 0): Pagination offset

**Example:**
```
GET /api/webhooks/logs?type=error&clientId=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "sent": 100,
    "received": 40,
    "errors": 10
  },
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 150,
    "count": 50
  },
  "data": [
    {
      "id": "log_1709000000000_abc123def",
      "timestamp": "2026-02-27T14:35:00.000Z",
      "type": "sent",
      "status": 200,
      "clientId": "1",
      "clientName": "MCI PLUS",
      "endpoint": "https://external-service.com/webhooks/chat",
      "message": "Message successfully delivered"
    },
    {
      "id": "log_1709000000000_xyz789",
      "timestamp": "2026-02-27T14:30:00.000Z",
      "type": "error",
      "status": "error",
      "clientId": "2",
      "clientName": "TechFlow",
      "endpoint": "https://external-service.com/webhooks/chat",
      "error": "Connection timeout after 30000ms"
    }
  ]
}
```

### DELETE Request (Clear Logs)

**Method:** `DELETE`

**Endpoint:** `/api/webhooks/logs`

**Query Parameters:**
- `type` (optional): Delete logs of specific type (`sent`, `received`, `error`)

If `type` is not provided, all logs are deleted.

**Example:**
```
DELETE /api/webhooks/logs?type=error
```

**Response:**
```json
{
  "success": true,
  "message": "10 log(s) deleted successfully",
  "deletedCount": 10
}
```

---

## Full Webhook Flow Example

### 1. User sends a message in the chat
```
Client Chat UI → POST /api/webhooks/send-message
```

### 2. Dashboard logs the message sent
```
Internal → POST /api/webhooks/logs
  { "type": "sent", "status": 200, ... }
```

### 3. External service receives and processes the message
```
Dashboard → POST https://your-service.com/webhooks/chat
```

### 4. External service sends back a response
```
Your Service → POST /api/webhooks/receive-response
  { "messageId": "...", "response": {...} }
```

### 5. Dashboard logs the response received
```
Internal → POST /api/webhooks/logs
  { "type": "received", "status": 200, ... }
```

### 6. Dashboard admin checks logs and responses
```
Dashboard admin → GET /api/webhooks/logs?type=sent
Dashboard admin → GET /api/webhooks/receive-response?clientId=1
```

---

## Security Considerations

1. **Webhook URL Verification:** Ensure your webhook endpoint validates requests are coming from your Dashboard API
2. **HTTPS Only:** Always use HTTPS for webhook URLs in production
3. **Request Signing:** Consider implementing HMAC SHA256 signing for verification
4. **Rate Limiting:** Implement rate limiting on your webhook endpoint to prevent abuse
5. **Input Validation:** Always validate and sanitize webhook payloads
6. **Error Handling:** Never expose sensitive information in error messages

---

## Monitoring and Debugging

### Check webhook delivery status
```bash
curl "http://localhost:3000/api/webhooks/logs?type=sent&limit=10"
```

### View responses from external services
```bash
curl "http://localhost:3000/api/webhooks/receive-response?limit=20"
```

### Monitor errors
```bash
curl "http://localhost:3000/api/webhooks/logs?type=error"
```

### Clear error logs
```bash
curl -X DELETE "http://localhost:3000/api/webhooks/logs?type=error"
```

---

## 4. Conversation History Endpoint

This endpoint stores and retrieves complete conversation threads between support teams and clients, maintaining the full message flow including both sent messages and received responses.

### POST Request (Add Message or Link Response)

**Method:** `POST`

**Endpoint:** `/api/webhooks/conversations`

**Headers:**
```
Content-Type: application/json
```

#### Action: Add Message

Adds a new message to a conversation thread:

```json
POST /api/webhooks/conversations
{
  "action": "add_message",
  "clientId": "1",
  "clientName": "MCI PLUS",
  "clientEmail": "contact@mciplus.com.br",
  "clientPhone": "+55 41 99123-4567",
  "sender": "support",
  "senderName": "Support Team",
  "message": "Como posso ajudar você hoje?",
  "type": "message",
  "status": "sent",
  "timestamp": "27/02/2026 14:30"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message added to conversation",
  "data": {
    "conversationId": "thread_1_1709000000000",
    "messageId": "msg_1709000000000_abc123def",
    "clientId": "1",
    "messageCount": 5
  }
}
```

#### Action: Link Response

Links a response from an external service to the original message:

```json
POST /api/webhooks/conversations
{
  "action": "link_response",
  "clientId": "1",
  "clientName": "MCI PLUS",
  "originalMessageId": "msg_1709000000000_abc123def",
  "response": {
    "ticketId": "TKT-12345",
    "assignedTo": "John Doe",
    "priority": "high",
    "status": "open"
  },
  "responseSource": "TicketingSystem",
  "status": "received"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Response linked to conversation",
  "data": {
    "conversationId": "thread_1_1709000000000",
    "responseMessageId": "resp_1709000000001_xyz789",
    "originalMessageId": "msg_1709000000000_abc123def",
    "messageCount": 6
  }
}
```

### GET Request (Retrieve Conversation)

**Method:** `GET`

**Endpoint:** `/api/webhooks/conversations`

**Query Parameters:**
- `clientId` (required): Client ID to retrieve conversation for
- `limit` (optional, default: 100): Number of messages per page
- `offset` (optional, default: 0): Pagination offset

**Example:**
```
GET /api/webhooks/conversations?clientId=1&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "1",
    "clientName": "MCI PLUS",
    "clientEmail": "contact@mciplus.com.br",
    "clientPhone": "+55 41 99123-4567",
    "threadId": "thread_1_1709000000000",
    "createdAt": "2026-02-27T10:00:00.000Z",
    "updatedAt": "2026-02-27T14:35:00.000Z",
    "pagination": {
      "limit": 100,
      "offset": 0,
      "total": 8,
      "count": 8
    },
    "stats": {
      "totalMessages": 8,
      "sentMessages": 4,
      "receivedMessages": 3,
      "failedMessages": 1,
      "messagesByType": {
        "message": 6,
        "note": 1,
        "alert": 1
      },
      "messagesByAuthor": {
        "support": 4,
        "client": 0,
        "system": 4
      }
    },
    "messages": [
      {
        "id": "msg_1709000000000_abc123def",
        "messageId": "msg_1709000000000_abc123def",
        "clientId": "1",
        "clientName": "MCI PLUS",
        "sender": "support",
        "senderName": "Support Team",
        "message": "Como posso ajudar você hoje?",
        "timestamp": "27/02/2026 14:30",
        "sentAt": "2026-02-27T14:30:00.000Z",
        "type": "message",
        "status": "sent"
      },
      {
        "id": "resp_1709000000001_xyz789",
        "messageId": "msg_1709000000000_abc123def",
        "clientId": "1",
        "clientName": "MCI PLUS",
        "sender": "system",
        "senderName": "Sistema - TicketingSystem",
        "message": "{\"ticketId\":\"TKT-12345\",\"assignedTo\":\"John Doe\",\"priority\":\"high\",\"status\":\"open\"}",
        "timestamp": "27/02/2026 14:35",
        "sentAt": "2026-02-27T14:35:00.000Z",
        "type": "message",
        "status": "received"
      }
    ]
  }
}
```

### DELETE Request (Clear Conversation)

**Method:** `DELETE`

**Endpoint:** `/api/webhooks/conversations`

**Query Parameters:**
- `clientId` (required): Client ID to delete conversation for

**Example:**
```
DELETE /api/webhooks/conversations?clientId=1
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "deletedMessageCount": 8
}
```

---

## Conversation Flow Example

### Step 1: Support Sends Message
```json
POST /api/webhooks/conversations
{
  "action": "add_message",
  "clientId": "2",
  "clientName": "TechFlow",
  "sender": "support",
  "senderName": "Maria Santos",
  "message": "Podemos agendar uma reunião?",
  "type": "message",
  "status": "sent"
}
```

### Step 2: Message Delivered to External Service
```json
POST /api/webhooks/send-message
{
  "clientId": "2",
  "clientName": "TechFlow",
  "message": "Podemos agendar uma reunião?",
  "senderName": "Maria Santos",
  "sender": "support"
}
```

### Step 3: External Service Responds
```json
POST /api/webhooks/conversations
{
  "action": "link_response",
  "clientId": "2",
  "originalMessageId": "msg_1709000000000_abc123def",
  "response": "Sim! Temos disponibilidade na próxima terça.",
  "responseSource": "CRM System"
}
```

### Step 4: View Complete Conversation
```
GET /api/webhooks/conversations?clientId=2
```

Returns all messages in order with statistics showing the complete conversation flow.

---

## Use Cases

### 1. Support Team Tracking
View complete conversation history for a client to understand context and previous interactions.

### 2. Automation Integration
External systems can link their responses back to the conversation for complete traceability.

### 3. Conversation Audit
Track all messages, responses, and system actions in one place for compliance and quality assurance.

### 4. Performance Metrics
Use statistics to measure response times, message types, and conversation volume.

### 5. Customer Context
New support agents can quickly review conversation history before contacting a client.

---

## Future Enhancements

- Request signing with SHA256 HMAC
- Webhook retry mechanism with exponential backoff
- Multiple webhook endpoints per event type
- Database persistence for logs and responses
- Webhook delivery dashboard UI
- Real-time webhook status monitoring
- Webhook event filtering and routing
- Custom webhook templates
- Conversation search and filtering
- Export conversations as reports
- Conversation archival after period
- Integration with CRM systems


