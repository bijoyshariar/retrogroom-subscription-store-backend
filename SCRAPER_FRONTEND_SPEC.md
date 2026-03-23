# CreativeCache — Scraper & Bulk Upload Frontend Spec

> For the frontend Claude session. Admin-only feature for importing products from competitor sites.

## Backend API — `/api/scraper` (All Admin Only)

### 1. Preview Scraped Products (No Save)

```
GET /api/scraper/preview?site=fanflix
GET /api/scraper/preview?site=netflixmart
GET /api/scraper/preview?site=subsbhai
GET /api/scraper/preview              (all sites)
```

**Auth:** Admin Bearer token required

**Response:**
```json
{
  "total": 54,
  "products": [
    {
      "productName": "Netflix Subscription (Mobile/PC/Laptop)",
      "productPrice": 500,
      "productSalePrice": 350,
      "productDescription": "...",
      "shortDescription": "...",
      "productCategory": "streaming",
      "productImage": "https://www.fanflixbd.com/cdn/shop/files/Netflix-subscription.jpg",
      "productImageUrl": ["https://...gallery1.jpg", "https://...gallery2.jpg"],
      "productTags": ["netflix", "streaming", "digital", "subscription"],
      "productVariants": [
        { "name": "1 Month", "price": 350, "salePrice": null },
        { "name": "3 Months", "price": 950, "salePrice": null }
      ],
      "sourceUrl": "https://www.fanflixbd.com/products/netflix-subscription-bangladesh",
      "sourceSite": "fanflixbd.com"
    }
  ],
  "message": "Scraped 54 products. Use /bulk-upload to import them."
}
```

### 2. Scrape & Import to Database

```
POST /api/scraper/import?site=fanflix
POST /api/scraper/import?site=netflixmart
POST /api/scraper/import?site=subsbhai
POST /api/scraper/import              (all sites)
```

**Auth:** Admin Bearer token required

**Response:**
```json
{
  "total": 197,
  "created": 191,
  "skipped": 6,
  "errors": [],
  "message": "Imported 191 products, skipped 6 duplicates, 0 errors"
}
```

**Important:** All imported products have `status: "DRAFT"`. Admin must review and publish them.

### 3. Manual Bulk Upload (JSON Body)

```
POST /api/scraper/bulk-upload
```

**Auth:** Admin Bearer token required

**Body:**
```json
{
  "products": [
    {
      "productName": "Custom Product",
      "productPrice": 500,
      "productSalePrice": 399,
      "productDescription": "Description here",
      "shortDescription": "Short desc",
      "productCategory": "streaming",
      "productImage": "https://example.com/image.jpg",
      "productImageUrl": [],
      "productTags": ["custom", "streaming"],
      "productVariants": [
        { "name": "1 Month", "price": 399, "salePrice": null }
      ]
    }
  ]
}
```

**Response:** Same as import (`total`, `created`, `skipped`, `errors`)

### 4. Bulk Update Status (Publish/Hide Imported Products)

```
PUT /api/scraper/bulk-status
```

**Auth:** Admin Bearer token required

**Body:**
```json
{
  "productIds": ["id1", "id2", "id3"],
  "status": "ACTIVE"
}
```

**Status options:** `"DRAFT"`, `"ACTIVE"`, `"HIDDEN"`

**Response:**
```json
{
  "modified": 3,
  "message": "3 products updated to ACTIVE"
}
```

---

## Supported Scrape Sources

| Site | URL | Type | Notes |
|------|-----|------|-------|
| FanFlix BD | fanflixbd.com | Shopify | Best data: variants, gallery images, tags, descriptions |
| Netflix Mart BD | netflixmartbd.net | WooCommerce | Paginated shop, product images + categories |
| SubsBhai | subsbhai.com | WooCommerce | Paginated shop, basic product info |

---

## Frontend Admin Pages Needed

### 1. Product Import Page (`/admin/import`)

**Layout:**
- Site selector dropdown: "All Sites", "FanFlix BD", "Netflix Mart BD", "SubsBhai"
- "Preview" button → calls `GET /api/scraper/preview?site=...`
- Shows scraped products in a table/grid with:
  - Checkbox (select/deselect for import)
  - Product image thumbnail (from `productImage` URL)
  - Product name
  - Price / Sale price
  - Category
  - Variants count
  - Source site
- "Import Selected" button → sends selected products to `POST /api/scraper/bulk-upload`
- "Import All" button → calls `POST /api/scraper/import?site=...`
- Shows result summary (created/skipped/errors)

### 2. Draft Products Management

After import, products are in `DRAFT` status. The existing admin products page should:
- Show a "Draft" tab/filter
- Allow selecting multiple products
- "Publish Selected" button → `PUT /api/scraper/bulk-status` with `status: "ACTIVE"`
- Allow editing individual products before publishing (change name, price, variants, images, etc.)

### 3. Manual Bulk Add (`/admin/import/manual`)

- JSON textarea or CSV upload
- Form to add multiple products at once
- Sends to `POST /api/scraper/bulk-upload`

---

## Image Handling for Scraped Products

Scraped products use **external image URLs** from the source sites. These are stored as-is in:
- `productImage` — cover image URL (e.g., `https://www.fanflixbd.com/cdn/shop/files/...`)
- `productImageUrl[]` — gallery image URLs

**The frontend should:**
- Display these external URLs directly in `<img>` tags
- For Next.js, add the source domains to `next.config.js`:

```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.fanflixbd.com' },
      { protocol: 'https', hostname: 'netflixmartbd.net' },
      { protocol: 'https', hostname: 'subsbhai.com' },
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
};
```

- If admin wants to replace with own images later, they use the existing upload endpoints:
  - `POST /api/product/:id/upload-image`
  - `POST /api/product/:id/upload-gallery`

---

## ScrapedProduct Data Shape

```typescript
interface ScrapedProduct {
  productName: string;
  productPrice: number;
  productSalePrice: number | null;
  productDescription: string;
  shortDescription: string;
  productCategory: string;
  productImage: string;           // External URL
  productImageUrl: string[];      // External URLs
  productTags: string[];
  productVariants: {
    name: string;
    price: number;
    salePrice: number | null;
  }[];
  sourceUrl: string;              // Original product page
  sourceSite: string;             // "fanflixbd.com", "netflixmartbd.net", "subsbhai.com"
}

interface BulkUploadResult {
  total: number;
  created: number;
  skipped: number;                // Duplicates (same slug)
  errors: string[];
  message: string;
}
```

---

## Tested Results

| Site | Products Scraped | With Images | With Variants |
|------|-----------------|-------------|---------------|
| FanFlix BD | 54 | All | Most (up to 12 per product) |
| Netflix Mart BD | ~100+ | All | Some |
| SubsBhai | ~40+ | All | Some |
| **Total** | **197** | **All** | **Varies** |

All 197 products imported successfully with 0 errors in testing.
