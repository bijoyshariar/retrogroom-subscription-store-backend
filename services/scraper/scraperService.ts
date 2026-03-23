import * as cheerio from "cheerio";
import { ScrapedProduct } from "./scraperTypes";

// Scrape netflixmartbd.net (WooCommerce)
export const scrapeNetflixMart = async (): Promise<ScrapedProduct[]> => {
  const products: ScrapedProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1
      ? "https://netflixmartbd.net/shop/"
      : `https://netflixmartbd.net/shop/page/${page}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) { hasMore = false; break; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const items = $(".product");
      if (items.length === 0) { hasMore = false; break; }

      items.each((_, el) => {
        const name = $(el).find(".woocommerce-loop-product__title, h2").text().trim();
        const link = $(el).find("a").first().attr("href") || "";
        const imgEl = $(el).find("img").first();
        const image = imgEl.attr("data-src") || imgEl.attr("src") || "";

        // Price parsing
        const delPrice = $(el).find("del .woocommerce-Price-amount, del .amount").first().text().replace(/[^\d.]/g, "");
        const insPrice = $(el).find("ins .woocommerce-Price-amount, ins .amount").first().text().replace(/[^\d.]/g, "");
        const singlePrice = $(el).find(".woocommerce-Price-amount, .amount").first().text().replace(/[^\d.]/g, "");

        const regularPrice = delPrice ? parseFloat(delPrice) : parseFloat(singlePrice) || 0;
        const salePrice = insPrice ? parseFloat(insPrice) : null;

        // Category from classes
        const classes = $(el).attr("class") || "";
        const catMatch = classes.match(/product_cat-([^\s]+)/);
        const category = catMatch ? catMatch[1].replace(/-/g, " ") : "digital";

        if (name) {
          products.push({
            productName: name,
            productPrice: regularPrice,
            productSalePrice: salePrice,
            productDescription: name,
            shortDescription: name,
            productCategory: category,
            productImage: image.startsWith("//") ? "https:" + image : image,
            productImageUrl: [],
            productTags: [category, "digital", "subscription"],
            productVariants: [],
            sourceUrl: link,
            sourceSite: "netflixmartbd.net",
          });
        }
      });

      page++;
      if (page > 20) hasMore = false; // safety limit
    } catch {
      hasMore = false;
    }
  }

  return products;
};

// Scrape fanflixbd.com (Shopify)
export const scrapeFanflix = async (): Promise<ScrapedProduct[]> => {
  const products: ScrapedProduct[] = [];

  try {
    // Shopify stores expose products as JSON
    const res = await fetch("https://www.fanflixbd.com/products.json?limit=250");
    if (res.ok) {
      const data = await res.json();
      for (const p of data.products) {
        const image = p.images?.[0]?.src || "";
        const galleryImages = (p.images || []).slice(1).map((img: any) => img.src);
        const variants = (p.variants || []).map((v: any) => ({
          name: v.title || v.option1 || "Default",
          price: parseFloat(v.price) || 0,
          salePrice: v.compare_at_price ? parseFloat(v.price) : null,
        }));

        const regularPrice = p.variants?.[0]?.compare_at_price
          ? parseFloat(p.variants[0].compare_at_price)
          : parseFloat(p.variants?.[0]?.price) || 0;
        const salePrice = p.variants?.[0]?.compare_at_price
          ? parseFloat(p.variants[0].price)
          : null;

        products.push({
          productName: p.title,
          productPrice: regularPrice,
          productSalePrice: salePrice,
          productDescription: p.body_html || p.title,
          shortDescription: p.title,
          productCategory: p.product_type || "streaming",
          productImage: image,
          productImageUrl: galleryImages,
          productTags: [...(p.tags || []), "digital", "subscription"],
          productVariants: variants,
          sourceUrl: `https://www.fanflixbd.com/products/${p.handle}`,
          sourceSite: "fanflixbd.com",
        });
      }
    }
  } catch (err) {
    console.error("FanFlix scrape error:", err);
  }

  return products;
};

// Scrape subsbhai.com (WooCommerce)
export const scrapeSubsBhai = async (): Promise<ScrapedProduct[]> => {
  const products: ScrapedProduct[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1
      ? "https://subsbhai.com/shop/"
      : `https://subsbhai.com/shop/page/${page}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) { hasMore = false; break; }
      const html = await res.text();
      const $ = cheerio.load(html);

      const items = $(".product, .products li, .product-item");
      if (items.length === 0) { hasMore = false; break; }

      items.each((_, el) => {
        const name = $(el).find(".woocommerce-loop-product__title, h2, .product-title, h3").first().text().trim();
        const link = $(el).find("a").first().attr("href") || "";
        const imgEl = $(el).find("img").first();
        const image = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src") || "";

        const delPrice = $(el).find("del .woocommerce-Price-amount, del .amount").first().text().replace(/[^\d.]/g, "");
        const insPrice = $(el).find("ins .woocommerce-Price-amount, ins .amount").first().text().replace(/[^\d.]/g, "");
        const singlePrice = $(el).find(".woocommerce-Price-amount, .amount").first().text().replace(/[^\d.]/g, "");

        const regularPrice = delPrice ? parseFloat(delPrice) : parseFloat(singlePrice) || 0;
        const salePrice = insPrice ? parseFloat(insPrice) : null;

        const classes = $(el).attr("class") || "";
        const catMatch = classes.match(/product_cat-([^\s]+)/);
        const category = catMatch ? catMatch[1].replace(/-/g, " ") : "digital";

        if (name && regularPrice > 0) {
          products.push({
            productName: name,
            productPrice: regularPrice,
            productSalePrice: salePrice,
            productDescription: name,
            shortDescription: name,
            productCategory: category,
            productImage: image.startsWith("//") ? "https:" + image : image,
            productImageUrl: [],
            productTags: [category, "digital", "subscription"],
            productVariants: [],
            sourceUrl: link,
            sourceSite: "subsbhai.com",
          });
        }
      });

      page++;
      if (page > 20) hasMore = false;
    } catch {
      hasMore = false;
    }
  }

  return products;
};

// Scrape all sites
export const scrapeAll = async (): Promise<ScrapedProduct[]> => {
  const results = await Promise.allSettled([
    scrapeNetflixMart(),
    scrapeFanflix(),
    scrapeSubsBhai(),
  ]);

  const all: ScrapedProduct[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }
  return all;
};
