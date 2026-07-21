# WhatsApp CRM API Reference

## Authentication
All API routes (`/api/*`) require an API key passed in the headers.
```http
x-api-key: your-api-key
```

---

## 👥 Contacts

### Create Contact
`POST /api/contacts`
Creates a new contact. The phone number will automatically be normalized to E.164 format.

**Request Body**
```json
{
  "phone": "9876543210",
  "name": "John Doe"
}
```

**Response (201 Created)**
```json
{
  "id": "uuid",
  "phone": "+919876543210",
  "name": "John Doe",
  "status": "active"
}
```

### List Contacts
`GET /api/contacts`
Returns a list of all contacts.

---

## 🚀 Campaigns

### Create Broadcast Campaign
`POST /api/campaigns`
Creates a new campaign and enqueues messages to all active contacts.

**Request Body**
```json
{
  "name": "Diwali Promo",
  "templateName": "promo_template_1"
}
```

---

## 📊 Analytics

### Get Campaign Stats
`GET /api/analytics/campaigns/:id`
Retrieves the delivery statistics for a specific campaign.

**Response**
```json
{
  "campaign": { "id": "...", "name": "..." },
  "stats": {
    "pending": 0,
    "sent": 150,
    "delivered": 148,
    "read": 102,
    "failed": 2
  }
}
```
