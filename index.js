// Import Express for creating the REST API server
const express = require("express");
// Import scraping functions from scraper.js
const { scrapeAmazon, scrapeProductDescription } = require("./scraper");

// Initialize Express app
const app = express();
// Use PORT from environment or default to 8080
const port = process.env.PORT || 8080;

// Enable JSON body parsing for incoming requests
app.use(express.json());

/**
 * GET /api/products
 * Returns a list of products for the given search term and number of pages.
 * Query params:
 *   - q: Search term (required)
 *   - pages: Number of pages to scrape (optional, default: 1)
 */
app.get("/api/products", async (req, res) => {
  const query = req.query.q;
  const pages = parseInt(req.query.pages) || 1;

  // Validate required query parameter
  if (!query) {
    return res.status(400).json({ message: "Query parameter `q` is required" });
  }

  try {
    // Scrape products from Amazon
    const products = await scrapeAmazon(query, pages);
    if (products.length === 0) {
      return res.status(404).json({ message: "No products found", products });
    }
    res.json(products);
  } catch (error) {
    // Handle errors and send response
    console.error("Scraping error:", error);
    res.status(500).json({
      message: "Error scraping Amazon",
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    });
  }
});

/**
 * GET /api/product-description
 * Returns the description for a specific product URL.
 * Query params:
 *   - url: Product URL (required)
 */
app.get("/api/product-description", async (req, res) => {
  const productUrl = req.query.url;

  // Validate required query parameter
  if (!productUrl) {
    return res
      .status(400)
      .json({ message: "Query parameter `url` is required" });
  }

  try {
    // Scrape product description from Amazon
    const description = await scrapeProductDescription(productUrl);
    res.json({ description });
  } catch (error) {
    // Handle errors and send response
    res
      .status(500)
      .json({
        message: "Error scraping product description",
        error: error.message,
      });
  }
});

// Start the Express server
app.listen(port);
