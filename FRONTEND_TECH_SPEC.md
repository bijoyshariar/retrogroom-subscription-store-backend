# CreativeCache — Frontend Technical Specification

> **For the frontend Claude session.** This is the complete backend API reference.
> All endpoints below are tested and working. Backend repo: `bijoyshariar/retrogroom-subscription-store-backend`

## What Is CreativeCache?

A **digital subscription/account store**. Users buy subscriptions (Netflix, Spotify, etc.), pay online, and receive account credentials (email + password) via their dashboard or WhatsApp. No physical shipping.

---

## Tech Stack (Frontend)

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios or fetch (with cookies for auth)
- **State:** React Context or Zustand for cart/auth state
- **Currency:** BDT (৳)

---

## Backend API

```
Development:  http://localhost:4001/api
Production:   https://<render-url>/api
```

### Authentication Pattern

Every authenticated request needs this header:
```
Authorization: Bearer <token>
```

Login/Register return `{ token, message }`. Store the token (localStorage or cookie).
Refresh token is in httpOnly cookie `Bearer` — sent automatically.

**Admin routes** require the user to have `roles: "ADMIN"` in the database.

---

## API Endpoints (All Tested & Working)

### 1. Auth & User — `/api/user`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/register` | No | `{ userName, email, password, mobile?, whatsappNumber? }` | `{ token, message }` |
| POST | `/login` | No | `{ email, password }` | `{ token, message }` |
| POST | `/admin` | No | `{ email, password }` | `{ token, message }` (fails if not ADMIN) |
| GET | `/refresh-token` | Cookie | - | `{ accessToken, message }` |
| POST | `/logout` | Yes | - | `{ message }` |
| PUT | `/update-user` | Yes | `{ firstName?, lastName?, email?, mobile?, whatsappNumber? }` | `{ user, message }` |
| PUT | `/update-address` | Yes | `{ shipmentAddress, state, city, zipcode }` | `{ user, message }` |
| PUT | `/update-password` | Yes | `{ currentPassword, newPassword }` | `{ message }` |
| POST | `/forgot-password-token` | No | `{ email }` | `{ resetURL, message }` |
| PUT | `/reset-password/:token` | No | `{ password }` | `{ message }` |
| POST | `/send-otp` | Yes | `{ type: "SMS" \| "EMAIL" }` | `{ message }` (SMS via Alpha SMS API) |
| POST | `/verify-otp` | Yes | `{ otp }` | `{ message }` |
| GET | `/all` | Admin | - | `User[]` |
| GET | `/get-wishlist` | Yes | - | User with populated wishlist |
| POST | `/add-wishlist` | Yes | `{ productId }` | `{ message }` |
| PUT | `/remove-wishlist` | Yes | `{ productId }` | `{ message, wishlist }` |
| POST | `/add-cart` | Yes | `{ productId, quantity, color, size }` | `{ message, cart, cartTotal }` |
| POST | `/remove-cartitem` | Yes | `{ productId, color, size }` | `{ message, cart, cartTotal }` |
| POST | `/add-cart-quantity-increase` | Yes | `{ productId, color, size }` | `{ message, cart, cartTotal }` |
| POST | `/add-cart-quantity-decrease` | Yes | `{ productId, color, size }` | `{ message, cart, cartTotal }` |
| POST | `/review` | Yes | `{ productId, orderProductId, rating, comment, orderId }` | `{ message }` |

#### User Data Shape
```typescript
interface User {
  _id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  whatsappNumber: string;
  roles: "ADMIN" | "CUSTOMER";
  cart: CartItem[];
  cartTotal: number;
  wishlist: string[] | Product[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  product: string;
  quantity: number;
  color: string;
  size: string;
  variantId?: string;
}
```

---

### 2. Products — `/api/product`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| GET | `/` | No | - | `Product[]` |
| GET | `/:slug` | No | - | `Product[]` (array with 1 item) |
| GET | `/tag/:tag` | No | - | `Product[]` |
| GET | `/category/:category` | No | - | `Product[]` |
| GET | `/collection/:collectionName` | No | - | `Product[]` |
| POST | `/createProduct` | Admin | See below | `{ Product, message }` |
| PUT | `/:id` | Admin | Partial product fields | `{ Product, message }` |
| PUT | `/stock-update/:id` | Admin | `{ productStock: [...] }` | `{ Product, message }` |
| DELETE | `/:id` | Admin | - | `{ message }` |
| POST | `/:id/upload-image` | Admin | `multipart/form-data` field: `image` | `{ images, message }` |
| POST | `/:id/upload-gallery` | Admin | `multipart/form-data` field: `images` (up to 10) | `{ images, gallery, message }` |
| DELETE | `/:id/delete-image` | Admin | `{ imageUrl }` | `{ message }` |

#### Create Product Body
```json
{
  "productName": "Netflix Premium",
  "productPrice": 250,
  "productSalePrice": 199,
  "productDescription": "Full description here",
  "shortDescription": "Brief one-liner",
  "longDescription": "<p>HTML content for detail page</p>",
  "productCategory": "streaming",
  "productTags": ["netflix", "streaming", "entertainment"],
  "productVariants": [
    { "name": "1 Month", "price": 250, "salePrice": 199 },
    { "name": "3 Months", "price": 700, "salePrice": 549 },
    { "name": "1 Year", "price": 2500, "salePrice": 1999 }
  ],
  "isFeatured": false,
  "isTrending": true,
  "trustNotes": "Guaranteed active account",
  "deliveryNotes": "Credentials within 2 hours",
  "lowStockLabel": "Limited!",
  "status": "ACTIVE"
}
```

#### Product Data Shape
```typescript
interface Product {
  _id: string;
  productName: string;
  productPrice: number;
  productSalePrice: number | null;
  productDescription: string;
  shortDescription: string;
  longDescription: string;
  productImage: string;                 // Cover image URL
  productImageUrl: string[];            // Gallery image URLs
  productCategory: string;
  productSlug: string;
  totalSoldProduct: number;
  productColors: string[];
  productSizes: string[];
  productStock: { color: string; size: string; quantity: number }[];
  productCollection: string;
  productTags: string[];
  productVariants: ProductVariant[];
  isFeatured: boolean;
  isTrending: boolean;
  trustNotes: string;
  deliveryNotes: string;
  lowStockLabel: string;
  status: "DRAFT" | "ACTIVE" | "HIDDEN";
  productRatings: ProductRating[];
  productTotalRating: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  _id: string;
  name: string;           // "1 Month", "3 Months", "1 Year"
  price: number;
  salePrice: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface ProductRating {
  rating: number;
  comment: string;
  orderProductId: string;
  postBy: string;
}
```

#### Image Upload Response
```json
{
  "images": {
    "original": "/uploads/products/abc-original.webp",
    "thumbnail": "/uploads/products/thumbnail/abc-thumbnail.webp",
    "card": "/uploads/products/card/abc-card.webp",
    "hero": "/uploads/products/hero/abc-hero.webp"
  },
  "message": "Product image uploaded successfully"
}
```

**Image sizes generated:**
| Size | Dimensions | Use |
|------|-----------|-----|
| thumbnail | 300×300 | Cart, small views |
| card | 600×600 | Product grid cards |
| hero | 1200×1200 | Product detail page |
| original | max 1200px | Stored as reference |

**Upload limits:** 2MB max, WebP/PNG/JPG only, all output as WebP.

Images served as static files: `http://localhost:4001/uploads/products/...`

---

### 3. Orders — `/api/order`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/create` | Yes | `{ products, paymentMethod }` | SSLCommerz/UddoktaPay: `{ url }`, COD: `{ orderProductId, newOrder, productId, message }` |
| GET | `/user-order` | Yes | - | `Order[]` |
| GET | `/my-subscriptions` | Yes | - | `Order[]` (only DELIVERED/ACTIVE/EXPIRED with credentials) |
| POST | `/renew` | Yes | `{ orderId }` | `{ renewalOrder, message }` |
| GET | `/all-orders` | Admin | - | `Order[]` |
| PUT | `/status-update/:id` | Admin | `{ status }` | `{ message }` |
| PUT | `/assign-credentials/:id` | Admin | `{ email, password, renewDate?, notes?, deliveryMethod? }` | `{ order, message }` |
| PUT | `/mark-active/:id` | Admin | - | `{ order, message }` |
| PUT | `/mark-expired/:id` | Admin | - | `{ order, message }` |

#### Create Order Body (Digital Product)
```json
{
  "products": [
    {
      "product": "product_id_here",
      "quantity": 1,
      "variantId": "variant_id_here",
      "variantName": "1 Month"
    }
  ],
  "paymentMethod": "UDDOKTAPAY"
}
```
- `variantId` + `variantName` are optional. If provided, uses variant pricing.
- If no variant, uses `productSalePrice || productPrice`.
- `color` and `size` are optional for digital products.

#### Order Data Shape
```typescript
interface Order {
  _id: string;
  orderNumber: string;                  // Auto-generated "CC-XXXXXXXXXX"
  user: string | User;
  products: OrderProduct[];
  totalAmount: number;
  discount: number;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentMethod: "COD" | "SSLCOMMERZ" | "UDDOKTAPAY";
  transectionId: string;
  credentials: {
    email: string;
    password: string;
    renewDate: string | null;
    notes: string;
  } | null;
  deliveryMethod: "DASHBOARD" | "WHATSAPP";
  deliveredAt: string | null;
  coupon: string | null;
  isRenewal: boolean;
  originalOrder: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderProduct {
  _id: string;
  product: string | Product;
  color: string;
  size: string;
  quantity: number;
  variantId: string;
  variantName: string;
  reviewToken: string;
}
```

#### Order Status Flow
```
PENDING → (user pays) → PAID → (admin assigns credentials) → DELIVERED → ACTIVE → EXPIRED
                                                                                      ↓
                                                                                user clicks RENEW
                                                                                      ↓
                                                                                new PENDING order (isRenewal: true)
```

---

### 4. Coupons — `/api/coupon`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/validate` | Yes | `{ code, orderAmount }` | `{ valid, couponId, discount, message }` |
| POST | `/create` | Admin | `{ code, type, value, minOrderAmount?, maxUses?, startsAt?, expiresAt? }` | `{ coupon, message }` |
| GET | `/all` | Admin | - | `Coupon[]` |
| PUT | `/:id` | Admin | Partial coupon fields | `{ coupon, message }` |
| DELETE | `/:id` | Admin | - | `{ message }` |

**Coupon types:** `"FIXED"` (flat ৳ off) or `"PERCENTAGE"` (% off)

#### Validate Response Example
```json
{
  "valid": true,
  "couponId": "abc123",
  "discount": 50,
  "message": "Coupon applied! You save ৳50"
}
```

---

### 5. Support Tickets — `/api/ticket`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/create` | Yes | `{ orderId, subject, message }` | `{ ticket, message }` |
| GET | `/my-tickets` | Yes | - | `Ticket[]` |
| GET | `/:id` | Yes | - | `Ticket` (with populated order & user) |
| POST | `/:id/reply` | Yes | `{ message }` | `{ ticket, message }` |
| GET | `/admin/all` | Admin | `?status=OPEN` | `Ticket[]` (filterable by status) |
| POST | `/admin/:id/reply` | Admin | `{ message }` | `{ ticket, message }` |
| PUT | `/admin/:id/status` | Admin | `{ status }` | `{ ticket, message }` |

#### Ticket Data Shape
```typescript
interface Ticket {
  _id: string;
  user: string | User;
  order: string | Order;
  ticketNumber: string;               // Auto-generated "TK-XXXXXXXXXX"
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  sender: "CUSTOMER" | "ADMIN";
  message: string;
  createdAt: string;
}
```

**Flow:** Customer creates → OPEN → Admin replies → IN_PROGRESS → Resolved/Closed

---

### 6. Refunds — `/api/refund`

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/request` | Yes | `{ orderId, reason }` | `{ refund, message }` |
| GET | `/my-refunds` | Yes | - | `Refund[]` |
| GET | `/admin/all` | Admin | `?status=REQUESTED` | `Refund[]` (filterable) |
| PUT | `/admin/:id` | Admin | `{ status, adminNotes? }` | `{ refund, message }` |

**Refund rule:** Only if order is `PAID` and 24+ hours have passed without delivery.

#### Refund Data Shape
```typescript
interface Refund {
  _id: string;
  user: string | User;
  order: string | Order;
  refundNumber: string;                // Auto-generated "RF-XXXXXXXXXX"
  reason: string;
  amount: number;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSED";
  adminNotes: string;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 7. Collections — `/api/collection`

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/:collectionCategory` | No | `{ collection }` |

---

### 8. Health — `/api/health`

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/` | `{ status: "ok", timestamp: "..." }` |

---

## Payment Gateways

### SSLCommerz
1. Frontend sends `POST /api/order/create` with `paymentMethod: "SSLCOMMERZ"`
2. Backend returns `{ url: "https://sandbox.sslcommerz.com/..." }`
3. Redirect user to that URL
4. After payment, SSLCommerz POSTs to backend callbacks
5. Backend handles success/fail/cancel internally

### UddoktaPay (bKash, Nagad, Rocket, Upay)
1. Frontend sends `POST /api/order/create` with `paymentMethod: "UDDOKTAPAY"`
2. Backend returns `{ url: "https://sandbox.uddoktapay.com/pay/..." }`
3. Redirect user to that URL
4. After payment, user is redirected to backend verify endpoint
5. Backend verifies and redirects to frontend:
   - **Success:** `{FRONTEND_URL}/checkout/success?order={orderNumber}`
   - **Failed:** `{FRONTEND_URL}/checkout/failed`
   - **Cancelled:** `{FRONTEND_URL}/checkout/cancelled`

**Frontend needs these 3 pages:**
- `/checkout/success` — show order confirmation, read `?order=` query param
- `/checkout/failed` — show failure message with retry option
- `/checkout/cancelled` — show cancellation message

---

## WhatsApp Credential Delivery (Frontend Only)

**No backend API needed.** Admin dashboard handles it:

1. Admin views order detail → fills in credentials form
2. Clicks "Send via WhatsApp" button
3. Frontend opens `wa.me` link in new tab with pre-typed message:

```typescript
const sendViaWhatsApp = (phone: string, creds: { email: string; password: string; renewDate: string }) => {
  const message = encodeURIComponent(
    `CreativeCache - Your Subscription Credentials\n\n` +
    `Email: ${creds.email}\n` +
    `Password: ${creds.password}\n` +
    `Renew Date: ${creds.renewDate}\n\n` +
    `Thank you for your purchase!`
  );
  const cleanPhone = phone.replace(/[\s+\-]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
};
```

4. Admin also calls `PUT /api/order/assign-credentials/:id` with `deliveryMethod: "WHATSAPP"` to save in system

The user's WhatsApp number comes from the order's populated user: `order.user.whatsappNumber`

---

## Frontend Pages Required

### Storefront (Public)
| Page | Route | Data Source |
|------|-------|-------------|
| Home | `/` | `GET /api/product/` (filter featured/trending client-side) |
| Products Archive | `/products` | `GET /api/product/` |
| Products by Category | `/products/category/:cat` | `GET /api/product/category/:cat` |
| Products by Tag | `/products/tag/:tag` | `GET /api/product/tag/:tag` |
| Product Detail | `/products/:slug` | `GET /api/product/:slug` |
| Cart | `/cart` | User's cart from auth state |
| Checkout | `/checkout` | Cart data + coupon validation |
| Checkout Success | `/checkout/success` | Query param `?order=CC-XXXXX` |
| Checkout Failed | `/checkout/failed` | Static page |
| Checkout Cancelled | `/checkout/cancelled` | Static page |
| Login | `/login` | `POST /api/user/login` |
| Register | `/register` | `POST /api/user/register` |
| Forgot Password | `/forgot-password` | `POST /api/user/forgot-password-token` |
| Reset Password | `/reset-password/:token` | `PUT /api/user/reset-password/:token` |

### User Dashboard (Authenticated)
| Page | Route | Data Source |
|------|-------|-------------|
| My Subscriptions | `/dashboard/subscriptions` | `GET /api/order/my-subscriptions` |
| My Orders | `/dashboard/orders` | `GET /api/order/user-order` |
| Support Tickets | `/dashboard/tickets` | `GET /api/ticket/my-tickets` |
| Ticket Detail | `/dashboard/tickets/:id` | `GET /api/ticket/:id` |
| My Refunds | `/dashboard/refunds` | `GET /api/refund/my-refunds` |
| Profile | `/dashboard/profile` | `PUT /api/user/update-user` |
| Wishlist | `/dashboard/wishlist` | `GET /api/user/get-wishlist` |

### Admin Dashboard (Admin role)
| Page | Route | Data Source |
|------|-------|-------------|
| Dashboard | `/admin` | Aggregate from orders/users/products |
| Products | `/admin/products` | `GET /api/product/` |
| Create Product | `/admin/products/create` | `POST /api/product/createProduct` |
| Edit Product | `/admin/products/:id` | `PUT /api/product/:id` |
| Orders | `/admin/orders` | `GET /api/order/all-orders` |
| Order Detail | `/admin/orders/:id` | From orders list + assign credentials form |
| Users | `/admin/users` | `GET /api/user/all` |
| Coupons | `/admin/coupons` | `GET /api/coupon/all` |
| Tickets | `/admin/tickets` | `GET /api/ticket/admin/all` |
| Ticket Detail | `/admin/tickets/:id` | Reply form + status update |
| Refunds | `/admin/refunds` | `GET /api/refund/admin/all` |

---

## Image Size Guide

| Image Type | Dimensions | Aspect | Max Size | Format | Notes |
|-----------|-----------|--------|----------|--------|-------|
| Product Card Thumbnail | 600×600 | 1:1 | 200KB | WebP/PNG | Grids, cart, wishlist |
| Product Detail Hero | 1200×1200 | 1:1 | 500KB | WebP/PNG | Main product page |
| Product Gallery | 1200×1200 | 1:1 | 500KB | WebP/PNG | productImageUrl[] |
| Collection Banner | 1600×600 | 8:3 | 400KB | WebP/JPG | Category headers |
| Hero Banner (homepage) | 1920×800 | 12:5 | 500KB | WebP/JPG | Homepage hero |
| Site Logo | SVG | - | 50KB | SVG | Scalable |
| Favicon | 512×512 | 1:1 | 50KB | PNG | Also 32×32, 192×192 |
| OG / Social Share | 1200×630 | ~1.9:1 | 300KB | JPG/PNG | Meta tags |

**Backend auto-generates** thumbnail (300×300), card (600×600), hero (1200×1200) from uploads.

### Responsive Breakpoints
| Breakpoint | Width | Product Grid |
|-----------|-------|-------------|
| Mobile | <640px | 2 columns |
| Tablet | 640–1024px | 3 columns |
| Desktop | 1024–1280px | 4 columns |
| Large | >1280px | 4–5 columns |

---

## Business Rules Summary

1. **Digital only** — no physical shipping, no shipment address required for orders
2. **On-demand stock** — no real inventory. `lowStockLabel` is marketing only ("Limited!", "Few left!")
3. **Multiple purchases** — user can buy same product 4 times = 4 separate credential sets
4. **Credentials** — assigned by admin after payment, visible on user dashboard
5. **Renewal** — no auto-renew. User clicks Renew → new PENDING order → pays → admin assigns new credentials
6. **Refund** — only if order is PAID and not delivered after 24 hours. Admin processes within 12 hours.
7. **Reviews** — only after order is DELIVERED. One review per order item.
8. **OTP** — SMS (Alpha SMS / sms.net.bd) or Email. Required for account verification.
9. **Currency** — BDT (৳) everywhere
10. **Admin access** — set `roles: "ADMIN"` directly in MongoDB. No self-promotion route.

---

## Test Accounts (Development)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@creativecache.com | Test123456 |
| Customer | customer@test.com | Cust123456 |

## Sample Products in DB

- **Netflix Premium** — slug: `netflix-premium`, category: `streaming`, variants: 1 Month (৳199), 3 Months (৳549)
- **Spotify Premium** — slug: `spotify-premium`, category: `music`, variants: 1 Month (৳120), 6 Months (৳650)
