# Escrow API Reference

**Base URL:** `https://escrow-backend-production-e42c.up.railway.app/v1`  
**Protocol:** HTTPS only  
**Format:** JSON  
**Version:** v1

---

## Overview

The Escrow API lets you embed programmable escrow directly into any application. Every action your own app takes — create a deal, fund it, release a milestone, raise a dispute — is a clean API call. External developers access the exact same surface.

```
Your App  ──┐
            ├──▶  Escrow API  ──▶  Polygon (smart contract)
3rd-Party  ──┘
```

---

## Authentication

The API supports two authentication schemes:

### 1. JWT Bearer (first-party / your own app)
```
Authorization: Bearer <jwt_token>
```
Obtain a JWT via the Auth endpoints. Tokens expire in 7 days.

### 2. API Key (third-party developers)
```
X-API-Key: sk_live_<key>
```
Generate keys via `POST /v1/keys`. API keys are rate-limited.

---

## Response Envelope

All responses follow a consistent shape:

**Success**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }   // optional, e.g. pagination
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Escrow not found"
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — missing/invalid token or API key |
| `403` | Forbidden — authenticated but not allowed |
| `404` | Not Found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Rate Limiting

API requests are rate-limited to ensure fair usage. Rate limit information is returned in response headers.

---

## API Key Management

### Generate an API key
```
POST /v1/keys
Authorization: Bearer <jwt_token>
```
**Body**
```json
{ "name": "My Integration" }
```
**Response `201`**
```json
{
  "id": "uuid",
  "key": "sk_live_abc123...",
  "name": "My Integration",
  "active": true,
  "created_at": "2026-04-26T17:00:00.000Z"
}
```
> ⚠️ The `key` value is shown **once**. Store it securely.

### List API keys
```
GET /v1/keys
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "My Integration",
    "active": true,
    "request_count": 42,
    "last_used_at": "2026-04-26T17:00:00.000Z",
    "created_at": "2026-04-26T16:00:00.000Z"
  }
]
```

### Get API key details
```
GET /v1/keys/:id
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{
  "id": "uuid",
  "name": "My Integration",
  "active": true,
  "request_count": 42,
  "last_used_at": "2026-04-26T17:00:00.000Z",
  "created_at": "2026-04-26T16:00:00.000Z",
  "expires_at": "2026-05-26T17:00:00.000Z"
}
```

### Revoke an API key
```
POST /v1/keys/:id/revoke
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{ "success": true, "message": "API key revoked" }
```

### Reactivate an API key
```
POST /v1/keys/:id/reactivate
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{ "success": true, "message": "API key reactivated" }
```

### Delete an API key
```
DELETE /v1/keys/:id
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{ "success": true, "message": "API key deleted" }
```

### Update API key expiry
```
PATCH /v1/keys/:id/expiry
Authorization: Bearer <jwt_token>
```
**Body**
```json
{ "expiresAt": "2026-06-26T17:00:00.000Z" }
```
**Response `200`**
```json
{ "success": true, "message": "Expiry updated" }
```

---

## Auth

### Request OTP
```
POST /v1/auth/login
```
**Body**
```json
{ "phone": "+2348012345678", "name": "Ada Okonkwo" }
```
**Response `200`**
```json
{ "message": "OTP sent" }
```

### Request Checkout OTP (public)
```
POST /v1/auth/checkout/login
```
Used by the checkout page to request OTP without requiring authentication.
**Body**
```json
{ "phone": "+2348012345678" }
```
**Response `200`**
```json
{ "otp": "123456" }
```

### Verify OTP
```
POST /v1/auth/verify-otp
```
**Body**
```json
{ "phone": "+2348012345678", "code": "123456" }
```
**Response `200`**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "phone": "+2348012345678",
    "name": "Ada Okonkwo",
    "walletAddress": "TYfQRH7AxrDSAZFKkps3dKVzCNsaPjQX5h"
  }
}
```

### Verify Checkout OTP (public)
```
POST /v1/auth/checkout/verify
```
Used by the checkout page to verify OTP without requiring authentication.
**Body**
```json
{ "phone": "+2348012345678", "code": "123456" }
```
**Response `200`**
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "phone": "+2348012345678",
    "walletAddress": "TYfQRH7AxrDSAZFKkps3dKVzCNsaPjQX5h"
  }
}
```

### Refresh token
```
POST /v1/auth/refresh
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{ "token": "eyJ..." }
```

### Get current user
```
GET /v1/auth/me
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{
  "user": {
    "id": 1,
    "phone": "+2348012345678",
    "name": "Ada Okonkwo",
    "walletAddress": "TYfQRH7AxrDSAZFKkps3dKVzCNsaPjQX5h"
  }
}
```

### Logout
```
POST /v1/auth/logout
Authorization: Bearer <jwt_token>
```
**Response `200`**
```json
{ "message": "Logged out successfully" }
```

---

## Escrow

All escrow endpoints require authentication.

### Create an escrow deal
```
POST /v1/escrow/create
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{
  "sellerId": "+2348099999999",
  "title": "Logo Design",
  "totalAmount": 150,
  "autoReleaseDays": 7,
  "milestones": [
    { "title": "Initial concepts", "amount": 50 },
    { "title": "Final delivery",   "amount": 100 }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `sellerId` | string | ✓ | Seller's user ID **or** phone number |
| `totalAmount` | number | ✓ | Amount in NGN |
| `title` | string | | Deal title |
| `autoReleaseDays` | number | | Days before auto-release (default: 7) |
| `milestones` | array | | If omitted, one milestone is created for the full amount |

**Response `201`**
```json
{
  "id": "esc_1714150800_x4k2a",
  "title": "Logo Design",
  "buyer": "Ada Okonkwo",
  "seller": "John Doe",
  "totalAmount": 150,
  "status": "pending",
  "createdAt": "2026-04-26T17:00:00.000Z",
  "updatedAt": null,
  "deadline": null,
  "hasDispute": false,
  "disputeReason": null,
  "contractAddress": "0x875f2Ce1DBEdD871777006328D104dE93a9C0e3C",
  "milestones": [
    { "id": "1", "title": "Initial concepts", "amount": 50, "status": "locked", "index": 0 },
    { "id": "2", "title": "Final delivery",   "amount": 100, "status": "locked", "index": 1 }
  ]
}
```

> All escrow responses use **camelCase** field names. Milestone `status` is `"locked"` or `"released"`.

### List escrows
```
GET /v1/escrow
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Returns all escrows where the authenticated user is buyer or seller.

**Response `200`** — array of escrow objects in the same camelCase shape as the create response. Each escrow includes its `milestones` array.

### Get a single escrow
```
GET /v1/escrow/:id
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
`:id` accepts either the numeric DB id or the string `escrow_id`. State is synced from the Polygon smart contract on every fetch.

**Response `200`** — escrow object in the same camelCase shape as the create response, including `milestones`.

### Get public checkout data
```
GET /v1/escrow/checkout/:id
```
Public endpoint (no auth) used by the checkout page to fetch deal details.

**Response `200`**
```json
{
  "data": {
    "id": "esc_...",
    "description": "Logo Design",
    "amount": 15000,
    "currency": "NGN",
    "seller": "+2348099999999",
    "status": "pending",
    "successUrl": "https://...",
    "cancelUrl": "https://..."
  }
}
```

### Pay for checkout
```
POST /v1/escrow/:id/pay
Authorization: Bearer <jwt_token>
```
Initiates Paystack payment for a checkout deal. Returns authorization URL to redirect to Paystack.

**Response `200`**
```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "CHK-123-..."
}
```

### Paystack checkout webhook
```
POST /v1/escrow/webhook/paystack
```
Public endpoint (no auth, signature validated) called by Paystack after payment completion. Updates escrow status to `active`.

**Request Body** (Paystack webhook format)
```json
{
  "event": "charge.success",
  "data": {
    "reference": "CHK-123-...",
    "amount": 1500000,
    "status": "success"
  }
}
```

**Response `200`**
```json
{ "success": true }
```

### Fund escrow (deposit)
```
POST /v1/escrow/:id/deposit
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Buyer calls this to lock funds into the smart contract from their wallet. Must be called after seller accepts.

**Response `200`** — updated escrow object with `status: "active"`.

### Accept invitation (seller)
```
POST /v1/escrow/:id/accept
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Only the seller of the escrow can call this. Moves status to `active`.

**Response `200`** — updated escrow object.

### Decline invitation (seller)
```
POST /v1/escrow/:id/decline
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Only the seller can call this. Moves status to `refunded` and cancels the deal.

**Response `200`**
```json
{ "success": true, "message": "Invitation declined. Deal cancelled." }
```

### Confirm delivery (buyer)
```
POST /v1/escrow/:id/confirm
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Buyer confirms all work is delivered. Releases all milestones on-chain and moves status to `completed`.

**Response `200`** — updated escrow object with `status: "completed"` and all milestones `status: "released"`.

### Release a milestone (buyer)
```
POST /v1/escrow/:id/release-milestone
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{ "index": 0 }
```
Releases a single milestone by index (0-based). Funds are sent to the seller on-chain.

**Response `200`** — updated escrow object with the target milestone's `status` changed to `"released"`.

### Raise a dispute
```
POST /v1/escrow/:id/dispute
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{ "reason": "Deliverable does not match the agreed scope." }
```
Either buyer or seller may call this. Moves status to `disputed`.

**Response `200`** — updated escrow object with `status: "disputed"` and `hasDispute: true`.

### Get deal messages
```
GET /v1/escrow/:id/messages
Authorization: Bearer <jwt_token>
```
Returns all chat messages for a deal.

**Response `200`**
```json
{
  "messages": [
    {
      "id": 1,
      "senderId": 1,
      "senderName": "Ada Okonkwo",
      "message": "When can you deliver?",
      "read": false,
      "createdAt": "2026-05-10T12:00:00.000Z"
    }
  ]
}
```

### Send message
```
POST /v1/escrow/:id/messages
Authorization: Bearer <jwt_token>
```
**Body**
```json
{ "message": "I'll deliver by Friday" }
```

**Response `200`**
```json
{ "success": true, "messageId": 2 }
```

### Mark messages as read
```
POST /v1/escrow/:id/messages/read
Authorization: Bearer <jwt_token>
```
Marks all messages in the deal as read for the authenticated user.

**Response `200`**
```json
{ "success": true }
```

---

## Escrow Status Flow

```
pending ──▶ active ──▶ completed
               │
               └──▶ disputed ──▶ resolved
               │
               └──▶ refunded
```

| Status | Meaning |
|--------|---------|
| `pending` | Created, waiting for seller to accept |
| `active` | Seller accepted; buyer can deposit |
| `completed` | All funds released to seller |
| `disputed` | Under review |
| `refunded` | Declined or cancelled |

---

## Wallet

### Get balance
```
GET /v1/wallet/balance
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Response `200`**
```json
{ "usdtBalance": 150.0 }
```

### Get transaction history
```
GET /v1/wallet/transactions
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Response `200`** — array of transaction objects:
```json
[
  {
    "id": 1,
    "type": "deposit",
    "amount": 150,
    "currency": "NGN",
    "status": "pending",
    "description": "Top-up via bank — ref: TOPUP-1-1714150800000",
    "created_at": "2026-04-26T17:00:00.000Z",
    "escrow_id": null
  }
]
```

### List banks
```
GET /v1/wallet/banks
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Returns list of supported Nigerian banks for withdrawals.

**Response `200`**
```json
[
  { "name": "Access Bank", "code": "044" },
  { "name": "First Bank", "code": "011" },
  { "name": "GTBank", "code": "058" },
  { "name": "Zenith Bank", "code": "057" }
]
```

### Resolve bank account
```
POST /v1/wallet/resolve-account
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
Resolves a bank account number to the account holder name.

**Body**
```json
{
  "accountNumber": "0123456789",
  "bankCode": "058"
}
```

**Response `200`**
```json
{
  "accountName": "Ada Okonkwo"
}
```

### Top up wallet
```
POST /v1/wallet/topup
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{ "amount": 5000, "method": "bank" }
```

| Field | Values |
|-------|--------|
| `amount` | Minimum 100 (NGN) |
| `method` | `"bank"` or `"card"` |

**Response `200`** (card method)
```json
{
  "success": true,
  "reference": "TOPUP-1-1714150800000",
  "authorizationUrl": "https://checkout.paystack.com/...",
  "message": "Complete payment in the browser to credit your wallet."
}
```

**Response `200`** (bank method)
```json
{
  "success": true,
  "reference": "TOPUP-1-1714150800000",
  "bankDetails": {
    "bankName": "Wema Bank",
    "accountNumber": "1234567890",
    "accountName": "Holdam Escrow"
  },
  "message": "Transfer the exact amount to the account below. Use your reference as narration."
}
```

### Withdraw
```
POST /v1/wallet/withdraw
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{
  "amount": 5000,
  "bankCode": "058",
  "accountNumber": "0123456789",
  "accountName": "Ada Okonkwo"
}
```

**Response `200`**
```json
{
  "success": true,
  "reference": "WITHDRAW-1-1714150800000",
  "message": "Withdrawal submitted. Funds will arrive within 1-2 business days."
}
```

### Paystack wallet webhook
```
POST /v1/wallet/webhook/paystack
```
Public endpoint (no auth, signature validated) called by Paystack after wallet top-up completion. Mints cNGN to user's wallet.

**Request Body** (Paystack webhook format)
```json
{
  "event": "charge.success",
  "data": {
    "reference": "TOPUP-1-...",
    "amount": 500000,
    "status": "success"
  }
}
```

**Response `200`**
```json
{ "success": true }
```

---

## User

### Get profile
```
GET /v1/user/profile
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Response `200`**
```json
{
  "user": {
    "id": 1,
    "phone": "+2348012345678",
    "name": "Ada Okonkwo",
    "walletAddress": "TYfQRH7AxrDSAZFKkps3dKVzCNsaPjQX5h"
  }
}
```

### Update profile
```
PUT /v1/user/update
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{ "name": "Ada Okonkwo" }
```
**Response `200`** — updated user object.

### Save bank account
```
POST /v1/user/bank-account
Authorization: Bearer <jwt_token>
```
Saves user's bank account details for withdrawals.

**Body**
```json
{
  "bankCode": "058",
  "accountNumber": "0123456789",
  "accountName": "Ada Okonkwo"
}
```

**Response `200`**
```json
{ "success": true, "message": "Bank account saved" }
```

### Close account
```
DELETE /v1/user/close-account
Authorization: Bearer <jwt_token>
```
Permanently closes user account and withdraws all funds to saved bank account.

**Response `200`**
```json
{ "success": true, "message": "Account closed successfully" }
```

### Submit feedback
```
POST /v1/user/feedback
Authorization: Bearer <jwt_token>
```
Submit user feedback to the platform.

**Body**
```json
{
  "category": "feature_request",
  "message": "Add dark mode support"
}
```

**Response `200`**
```json
{ "success": true, "message": "Feedback received" }
```

### Get bank accounts
```
GET /v1/user/bank-accounts
Authorization: Bearer <jwt_token>
```
Returns all saved bank accounts for the authenticated user.

**Response `200`**
```json
{
  "bankAccounts": [
    {
      "id": "1",
      "bankName": "GTBank",
      "bankCode": "058",
      "accountNumber": "0123456789",
      "accountName": "Ada Okonkwo",
      "isDefault": true
    }
  ]
}
```

### Add bank account
```
POST /v1/user/bank-accounts
Authorization: Bearer <jwt_token>
```
Adds a new bank account for the authenticated user.

**Body**
```json
{
  "accountNumber": "0123456789",
  "bankCode": "058",
  "bankName": "GTBank",
  "accountName": "Ada Okonkwo"
}
```

**Response `200`**
```json
{
  "bankAccount": {
    "id": "1",
    "bankName": "GTBank",
    "bankCode": "058",
    "accountNumber": "0123456789",
    "accountName": "Ada Okonkwo",
    "isDefault": true
  }
}
```

### Delete bank account
```
DELETE /v1/user/bank-accounts/:id
Authorization: Bearer <jwt_token>
```
Deletes a saved bank account.

**Response `200`**
```json
{ "success": true }
```

### Set default bank account
```
PUT /v1/user/bank-accounts/:id/default
Authorization: Bearer <jwt_token>
```
Sets a bank account as the default for payouts.

**Response `200`**
```json
{ "success": true }
```

### Get cards
```
GET /v1/user/cards
Authorization: Bearer <jwt_token>
```
Returns all saved cards for the authenticated user.

**Response `200`**
```json
{
  "cards": [
    {
      "id": "1",
      "last4": "4242",
      "brand": "visa",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cardHolderName": "Ada Okonkwo",
      "authorizationCode": "AUTH_xxx",
      "isDefault": true
    }
  ]
}
```

### Delete card
```
DELETE /v1/user/cards/:id
Authorization: Bearer <jwt_token>
```
Deletes a saved card.

**Response `200`**
```json
{ "success": true }
```

### Set default card
```
PUT /v1/user/cards/:id/default
Authorization: Bearer <jwt_token>
```
Sets a card as the default for payments.

**Response `200`**
```json
{ "success": true }
```

### Initiate card save
```
POST /v1/user/cards/save
Authorization: Bearer <jwt_token>
```
Initiates a Paystack transaction to save a card for future payments.

**Body**
```json
{ "amount": 50 }
```

**Response `200`**
```json
{
  "authorizationUrl": "https://checkout.paystack.com/..."
}
```

### Get notification preferences
```
GET /v1/user/notification-prefs
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Response `200`**
```json
{
  "prefs": {
    "deals": true,
    "payments": true,
    "disputes": true,
    "auto_release": true,
    "promotions": false
  }
}
```

### Update notification preferences
```
PUT /v1/user/notification-prefs
Authorization: Bearer <jwt_token> | X-API-Key: <key>
```
**Body**
```json
{
  "prefs": {
    "deals": true,
    "payments": true,
    "disputes": false,
    "auto_release": true,
    "promotions": false
  }
}
```
**Response `200`**
```json
{ "success": true, "prefs": { ... } }
```

---

## SDK (Escrow SDK Management)

### Create SDK instance
```
POST /v1/sdk/escrow/create
Authorization: Bearer <jwt_token>
```
Creates a new escrow SDK instance for external developers to integrate with.

**Body**
```json
{
  "name": "My Integration",
  "description": "E-commerce integration"
}
```

**Response `200`**
```json
{
  "id": "sdk_...",
  "name": "My Integration",
  "apiKey": "sk_live_...",
  "secret": "sk_secret_...",
  "createdAt": "2026-05-10T12:00:00.000Z"
}
```

### List SDK instances
```
GET /v1/sdk/escrow
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{
  "sdks": [
    {
      "id": "sdk_...",
      "name": "My Integration",
      "active": true,
      "createdAt": "2026-05-10T12:00:00.000Z"
    }
  ]
}
```

### Get SDK instance
```
GET /v1/sdk/escrow/:id
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{
  "id": "sdk_...",
  "name": "My Integration",
  "description": "E-commerce integration",
  "apiKey": "sk_live_...",
  "webhookUrl": "https://...",
  "active": true
}
```

---

## KYC (Tier System)

The KYC system uses a tier-based approach.

### Get tier information
```
GET /v1/kyc/tiers
```
Public endpoint - returns available tiers and their limits.

**Response `200`**
```json
{
  "tiers": [
    {
      "tier": 1,
      "name": "Basic",
      "limits": {
        "dailyWithdrawal": 100000,
        "monthlyWithdrawal": 500000
      }
    },
    {
      "tier": 2,
      "name": "Verified",
      "limits": {
        "dailyWithdrawal": 500000,
        "monthlyWithdrawal": 2000000
      }
    }
  ]
}
```

### Get my tier
```
GET /v1/kyc/my-tier
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{
  "tier": 1,
  "name": "Basic",
  "limits": { ... },
  "currentUsage": { ... }
}
```

### Request tier upgrade
```
POST /v1/kyc/upgrade
Authorization: Bearer <jwt_token>
```

**Body**
```json
{ "targetTier": 2 }
```

**Response `200`**
```json
{
  "success": true,
  "message": "Upgrade request submitted"
}
```

### Submit KYC documents
```
POST /v1/kyc/documents
Authorization: Bearer <jwt_token>
```

**Body**
```json
{
  "idType": "NIN",
  "idNumber": "12345678901",
  "documents": [
    {
      "type": "front",
      "fileName": "id-front.jpg",
      "fileData": "base64..."
    }
  ]
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Documents submitted for review"
}
```

---

## Config

### Get app configuration
```
GET /v1/config
```
Public endpoint - no authentication required.

**Response `200`**
```json
{
  "platform": {
    "name": "Escrow Platform",
    "version": "1.0.0",
    "environment": "production"
  },
  "features": {
    "kyc_enabled": true,
    "auto_release_enabled": true,
    "dispute_resolution_enabled": true
  },
  "limits": {
    "min_deposit": 100,
    "max_deposit": 1000000,
    "auto_release_days": 7
  }
}
```

### Get public reserve proof
```
GET /v1/config/public/reserve-proof
```
Public endpoint for transparency - shows proof of reserves.

**Response `200`**
```json
{
  "rootHash": "0x...",
  "userCount": 1000,
  "totalReserve": 50000000,
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

### Get legal guarantees
```
GET /v1/config/public/legal-guarantees
```
Public endpoint - returns legal terms and guarantees.

**Response `200`**
```json
{
  "guarantees": [
    "All funds are held in smart contracts",
    "Disputes are resolved by independent arbitrators",
    "KYC required for withdrawals above certain thresholds"
  ],
  "terms_url": "https://your-domain.com/terms"
}
```

---

## Notifications

### Get user's notifications
```
GET /v1/notifications
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "escrow_update",
      "title": "Milestone released",
      "message": "The first milestone has been released",
      "read": false,
      "created_at": "2026-05-10T12:00:00.000Z"
    }
  ]
}
```

### Mark notification as read
```
PATCH /v1/notifications/:id/read
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{ "success": true, "message": "Notification marked as read" }
```

### Mark all notifications as read
```
PATCH /v1/notifications/read-all
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{ "success": true, "message": "All notifications marked as read" }
```

---

## Reserve (Proof of Reserves)

### Get user's reserve proof
```
GET /v1/reserve/user-proof
Authorization: Bearer <jwt_token>
```
Returns the user's inclusion proof in the reserve Merkle tree.

**Response `200`**
```json
{
  "userProof": {
    "userId": 1,
    "balance": 15000,
    "proof": ["0x...", "0x..."],
    "rootHash": "0x..."
  }
}
```

---

## Public Endpoints

### Get public reserve proof
```
GET /public/reserve-proof
```
No authentication required. Returns the latest proof of reserves.

**Response `200`**
```json
{
  "rootHash": "0x...",
  "userCount": 1000,
  "totalReserve": 50000000,
  "timestamp": "2026-05-10T12:00:00.000Z"
}
```

### Get legal guarantees
```
GET /public/legal-guarantees
```
No authentication required. Returns legal terms and guarantees.

**Response `200`**
```json
{
  "guarantees": [
    "All funds are held in smart contracts",
    "Disputes are resolved by independent arbitrators"
  ],
  "terms_url": "https://your-domain.com/terms"
}
```

---

## Webhooks

Holdam uses webhooks to notify your application when an event happens in your account. Webhooks are particularly useful for asynchronous events like when a buyer funds a deal or a milestone is released.

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/merchant/webhook` | Get current webhook configuration |
| `POST` | `/merchant/webhook` | Create or update webhook configuration |
| `POST` | `/merchant/webhook/regenerate-secret` | Generate a new signing secret |
| `DELETE` | `/merchant/webhook` | Delete webhook configuration |

### Get merchant settings
```
GET /merchant/settings
Authorization: Bearer <jwt_token>
```

**Response `200`**
```json
{
  "webhookUrl": "https://...",
  "autoRelease": true,
  "notifications": {
    "email": true,
    "sms": false
  }
}
```

### Update merchant settings
```
PUT /merchant/settings
Authorization: Bearer <jwt_token>
```
**Body**
```json
{
  "webhookUrl": "https://...",
  "autoRelease": false
}
```

**Response `200`**
```json
{ "success": true, "settings": { ... } }
```

### Event Types

| Event | Description |
|-------|-------------|
| `deal.funded` | Buyer has successfully deposited funds into escrow |
| `deal.released` | Funds have been released to the seller |
| `deal.disputed` | A dispute has been opened on the deal |

### Webhook Payload

```json
{
  "event": "deal.funded",
  "timestamp": "2026-05-10T12:00:00.000Z",
  "data": {
    "dealId": "esc_123...",
    "deal": {
      "id": "esc_123...",
      "title": "Logo Design",
      "amount": 500,
      "status": "funded"
    },
    "buyer": { "phone": "+234..." },
    "seller": { "phone": "+234..." }
  }
}
```

### Verifying Signatures

Holdam signs all webhook events with a secret key. You should verify the signature to ensure the request is genuinely from Holdam. The signature is sent in the `X-Holdam-Signature` header.

**Example: Next.js API Route (App Router)**

```javascript
// app/api/webhooks/holdam/route.js
import { headers } from 'next/headers';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.HOLDAM_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('x-holdam-signature');
  
  // Verify signature
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
    
  if (expected !== signature) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  
  // Handle the event
  if (event.event === 'deal.funded') {
    // Update order status in your DB
  }
  
  return Response.json({ received: true });
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `MISSING_FIELDS` | 400 | Required fields not provided |
| `INVALID_AMOUNT` | 400 | Amount below minimum or invalid |
| `SELLER_NOT_FOUND` | 404 | `sellerId` does not match any user |
| `ESCROW_NOT_FOUND` | 404 | Escrow ID does not exist |
| `UNAUTHORIZED` | 401 | Token or API key missing/invalid |
| `FORBIDDEN` | 403 | Authenticated but not a participant |
| `RATE_LIMITED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Route does not exist |

---

## Quick Start (external developer)

```bash
# 1. Create an account and get a JWT (use your app's phone + OTP flow)
TOKEN="eyJ..."

# 2. Generate an API key
curl -X POST https://escrow-backend-production-e42c.up.railway.app/v1/keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "My Integration" }'
# → { "key": "sk_live_abc123..." }

KEY="sk_live_abc123..."

# 3. Create an escrow deal
curl -X POST https://escrow-backend-production-e42c.up.railway.app/v1/escrow/create \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": "+2348099999999",
    "title": "Website Redesign",
    "totalAmount": 500,
    "autoReleaseDays": 14,
    "milestones": [
      { "title": "Wireframes", "amount": 100 },
      { "title": "Final site", "amount": 400 }
    ]
  }'

# 4. Release a milestone when work is done
curl -X POST https://escrow-backend-production-e42c.up.railway.app/v1/escrow/esc_xxx/release-milestone \
  -H "X-API-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "index": 0 }'
```

---

## Blockchain

All escrow state is anchored to the **Polygon (EVM-compatible blockchain)**.

| Component | Value |
|-----------|-------|
| Network | Polygon Amoy testnet |
| RPC | `https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY` |
| Chain ID | 80002 |
| Factory contract | `0x875f2Ce1DBEdD871777006328D104dE93a9C0e3C` |
| cNGN (stablecoin) | `0x94AE164dDE8d6C9e6eD9D9ed009cC4826E0F9A75` |
| Explorer | `https://amoy.polygonscan.com` |

Every mutating action (deposit, confirm, release, dispute) returns the **updated escrow object** reflecting the new on-chain state. The underlying `txHash` is stored in the transactions table and retrievable via `GET /v1/wallet/transactions`.
