# CreativeCache Frontend Technical Specification

> This file is for the frontend Claude session. It describes the backend API, data models, and integration requirements.

## Tech Stack (Frontend)
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios or fetch (with cookies for auth)
- **State:** React Context or Zustand for cart/auth state
- **Currency:** BDT (৳)

---

## Backend API Base URL
```
Development: http://localhost:4001/api
```

## Authentication
- JWT Bearer token in `Authorization: Bearer <token>` header
- Refresh token stored in httpOnly cookie named `Bearer`
- Auth endpoints return `{ token, message }`

---

## API Endpoints

### Auth (`/api/user`)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/register` | No | `{ userName, email, password, mobile?, whatsappNumber? }` | Register |
| POST | `/login` | No | `{ email, password }` | Login |
| POST | `/admin` | No | `{ email, password }` | Admin login |
| GET | `/refresh-token` | Cookie | - | Refresh access token |
| POST | `/logout` | Yes | - | Logout |
| PUT | `/update-user` | Yes | `{ firstName?, lastName?, email?, mobile?, whatsappNumber? }` | Update profile |
| PUT | `/update-address` | Yes | `{ shipmentAddress, state, city, zipcode }` | Update address |
| PUT | `/update-password` | Yes | `{ currentPassword, newPassword }` | Change password |
| POST | `/forgot-password-token` | No | `{ email }` | Request reset token |
| PUT | `/reset-password/:token` | No | `{ password }` | Reset password |
| POST | `/send-otp` | Yes | `{ type: "SMS" \| "EMAIL" }` | Send OTP verification |
| POST | `/verify-otp` | Yes | `{ otp }` | Verify OTP |
| GET | `/all` | Admin | - | Get all users |

### Products (`/api/product`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Get all products |
| GET | `/:slug` | No | Get product by slug |
| GET | `/tag/:tag` | No | Get products by tag |
| GET | `/category/:category` | No | Get products by category |
| GET | `/collection/:collectionName` | No | Get products by collection |
| POST | `/createProduct` | Admin | Create product |
| PUT | `/:id` | No* | Update product data |
| PUT | `/stock-update/:id` | Admin | Update stock |
| DELETE | `/:id` | Admin | Delete product |

### Product Data Shape
```typescript
interface Product {
  _id: string;
  productName: string;
  productPrice: number;
  productSalePrice: number | null;       // NEW: sale price
  productDescription: string;
  shortDescription: string;              // NEW: brief description
  longDescription: string;               // NEW: detailed HTML description
  productImage: string;
  productImageUrl: string[];
  productCategory: string;
  productSlug: string;
  totalSoldProduct: number;
  productColors: string[];
  productSizes: string[];
  productStock: { color: string; size: string; quantity: number }[];
  productCollection: string;
  productTags: string[];                 // NEW: tags for filtering
  productVariants: ProductVariant[];     // NEW: subscription variants
  isFeatured: boolean;                   // NEW: homepage featured
  isTrending: boolean;                   // NEW: trending badge
  trustNotes: string;                    // NEW: trust/guarantee text
  deliveryNotes: string;                 // NEW: delivery info text
  lowStockLabel: string;                 // NEW: marketing label ("Limited!", etc.)
  status: "DRAFT" | "ACTIVE" | "HIDDEN"; // NEW: visibility
  productRatings: { rating: number; comment: string; postBy: string }[];
  productTotalRating: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  _id: string;
  name: string;        // e.g., "1 Month", "3 Months", "1 Year"
  price: number;
  salePrice: number | null;
  isActive: boolean;
  sortOrder: number;
}
```

### Orders (`/api/order`)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/create` | Yes | `{ products, paymentMethod }` | Create order |
| GET | `/user-order` | Yes | - | Get my orders |
| GET | `/my-subscriptions` | Yes | - | Get active/expired subscriptions with credentials |
| POST | `/renew` | Yes | `{ orderId }` | Request subscription renewal |
| GET | `/all-orders` | Admin | - | Get all orders |
| PUT | `/status-update/:id` | Admin | `{ status }` | Update order status |
| PUT | `/assign-credentials/:id` | Admin | `{ email, password, renewDate?, notes?, deliveryMethod? }` | Assign credentials |
| PUT | `/mark-active/:id` | Admin | - | Mark as active subscription |
| PUT | `/mark-expired/:id` | Admin | - | Mark as expired |

### Order Data Shape
```typescript
interface Order {
  _id: string;
  orderNumber: string;                    // Auto-generated "CC-XXXXX"
  user: string;
  products: OrderProduct[];
  totalAmount: number;
  discount: number;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  paymentMethod: "COD" | "SSLCOMMERZ" | "UDDOKTAPAY";
  transectionId: string;
  credentials: {                           // NEW: subscription credentials
    email: string;
    password: string;
    renewDate: string | null;
    notes: string;
  } | null;
  deliveryMethod: "DASHBOARD" | "WHATSAPP"; // NEW
  deliveredAt: string | null;
  isRenewal: boolean;
  originalOrder: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Order Flow
```
PENDING → (user pays) → PAID → (admin assigns credentials) → DELIVERED → ACTIVE → EXPIRED
                                                                                    ↓
                                                                              user clicks RENEW
                                                                                    ↓
                                                                              new PENDING order
```

### Coupons (`/api/coupon`)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/validate` | Yes | `{ code, orderAmount }` | Validate & get discount |
| POST | `/create` | Admin | `{ code, type, value, minOrderAmount?, maxUses?, startsAt?, expiresAt? }` | Create coupon |
| GET | `/all` | Admin | - | Get all coupons |
| PUT | `/:id` | Admin | `{ ...fields }` | Update coupon |
| DELETE | `/:id` | Admin | - | Delete coupon |

**Coupon types:** `"FIXED"` (flat ৳ off) or `"PERCENTAGE"` (% off)

### Tickets (`/api/ticket`)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/create` | Yes | `{ orderId, subject, message }` | Create ticket |
| GET | `/my-tickets` | Yes | - | Get my tickets |
| GET | `/:id` | Yes | - | Get ticket detail |
| POST | `/:id/reply` | Yes | `{ message }` | Customer reply |
| GET | `/admin/all` | Admin | `?status=OPEN` | Get all tickets (filterable) |
| POST | `/admin/:id/reply` | Admin | `{ message }` | Admin reply |
| PUT | `/admin/:id/status` | Admin | `{ status }` | Update status |

**Ticket statuses:** `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

### Refunds (`/api/refund`)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/request` | Yes | `{ orderId, reason }` | Request refund (after 24hrs no delivery) |
| GET | `/my-refunds` | Yes | - | Get my refunds |
| GET | `/admin/all` | Admin | `?status=REQUESTED` | Get all refunds |
| PUT | `/admin/:id` | Admin | `{ status, adminNotes? }` | Process refund (APPROVED/REJECTED/PROCESSED) |

**Refund rule:** User can request refund only if order is PAID and 24+ hours have passed without delivery. Processed within 12 hours.

### Cart (stored on User document)
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/user/add-cart` | Yes | `{ productId, quantity, color, size }` | Add to cart |
| POST | `/user/remove-cartitem` | Yes | `{ productId, color, size }` | Remove from cart |
| POST | `/user/add-cart-quantity-increase` | Yes | `{ productId, color, size }` | +1 quantity |
| POST | `/user/add-cart-quantity-decrease` | Yes | `{ productId, color, size }` | -1 quantity |

### Wishlist
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/user/add-wishlist` | Yes | `{ productId }` | Add to wishlist |
| PUT | `/user/remove-wishlist` | Yes | `{ productId }` | Remove from wishlist |
| GET | `/user/get-wishlist` | Yes | - | Get wishlist |

### Reviews
| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/user/review` | Yes | `{ productId, orderProductId, rating, comment, orderId }` | Add review (must have purchased & delivered) |

---

## Key Frontend Pages

### Storefront (Public)
- **Home** — featured/trending products, collections, low stock labels
- **Products (Archive)** — filterable by category/tag/collection, show sale prices
- **Product Detail** — variant selector (subscription durations), trust notes, delivery notes, reviews, add to cart
- **Cart** — product list, coupon code input, checkout
- **Checkout** — payment method selection (SSLCommerz / UddoktaPay)

### User Dashboard (Authenticated)
- **My Subscriptions** — list of active/expired subs with credentials (email, password, renew date). Renew button for expired.
- **My Orders** — order history with status tracking
- **Support Tickets** — create tickets linked to orders, view replies, reply back
- **My Refunds** — refund request history
- **Profile** — update info, WhatsApp number, OTP verification
- **Wishlist**

### Admin Dashboard (Admin role)
- **Dashboard** — overview stats
- **Products** — CRUD, manage variants/tags/images, set featured/trending/lowStockLabel
- **Orders** — view all, assign credentials, mark active/expired, change status
- **Users** — view all users
- **Coupons** — CRUD coupons
- **Tickets** — view/reply to support tickets
- **Refunds** — approve/reject/process refund requests

---

## Payment Gateways
1. **SSLCommerz** — already integrated. Backend returns `{ url }` → redirect user to payment page → callbacks handle success/fail/cancel
2. **UddoktaPay** — to be integrated (config ready in backend). Similar flow expected.

## Business Rules
- No physical shipping — this is a digital subscription store
- Stock is on-demand (no real inventory tracking), `lowStockLabel` is for marketing only
- Each purchase generates separate credentials (buy 4x = 4 credential sets)
- Credentials visible on user dashboard after admin assigns them
- Renewal = new order linked to original via `originalOrder` field
- Refund only available if order PAID but not delivered after 24 hours
