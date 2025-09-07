// Import Puppeteer for browser automation
const puppeteer = require("puppeteer");

// Maximum number of retry attempts for failed operations
const MAX_RETRIES = 3;
// Base delay (in ms) for exponential backoff between retries
const BASE_DELAY = 5000;

/**
 * Retries an async operation with exponential backoff.
 * @param {Function} operation - The async operation to retry.
 * @param {number} retries - Number of retry attempts.
 */
async function retryOperation(operation, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed. Error: ${error.message}`);
      if (i === retries - 1) throw error;
      // Exponential backoff delay
      const delay = BASE_DELAY * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Launches a new Puppeteer browser instance with custom settings.
 * @returns {Promise<puppeteer.Browser>}
 */
async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
    ],
    defaultViewport: null,
    protocolTimeout: 180000,
  });
}

/**
 * Scrapes product data from a single Amazon search results page.
 * @param {string} url - The URL of the Amazon search results page.
 * @returns {Promise<Array>} Array of product objects.
 */
async function scrapePage(url) {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    // Set navigation and operation timeouts
    await page.setDefaultNavigationTimeout(120000);
    await page.setDefaultTimeout(120000);
    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Retry navigation in case of transient errors
    await retryOperation(async () => {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });
    });

    // Extract product data from the page
    const products = await page.evaluate(() => {
      const items = Array.from(
        document.querySelectorAll(".s-main-slot .s-result-item")
      );
      return items
        .map((item) => {
          // Extract product details
          const titleElement = item.querySelector("h2");
          const priceElement = item.querySelector(".a-price-whole");
          const imageElement = item.querySelector(".s-image");
          const linkElement = titleElement
            ? titleElement.querySelector("a")
            : null;

          const title = titleElement ? titleElement.innerText : null;
          const price = priceElement ? priceElement.innerText : null;
          const image = imageElement ? imageElement.src : null;
          const link = linkElement
            ? `https://www.amazon.in${linkElement.getAttribute("href")}`
            : null;

          // Only return products with all required fields
          return title && price && image ? { title, price, image, link } : null;
        })
        .filter((product) => product !== null);
    });

    return products;
  } catch (error) {
    console.error("Error scraping page:", error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Scrapes multiple pages of Amazon search results for a given query.
 * @param {string} query - The search term.
 * @param {number} maxPages - Maximum number of pages to scrape.
 * @returns {Promise<Array>} Array of all products found.
 */
async function scrapeAmazon(query, maxPages = 5) {
  const products = [];

  for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
    console.log(`Scraping page ${currentPage}...`);
    // Build the search URL for the current page
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(
      query
    )}&page=${currentPage}`;

    // Scrape products from the current page
    const pageProducts = await scrapePage(url);
    products.push(...pageProducts);

    // Stop if no products are found on the current page
    if (pageProducts.length === 0) {
      console.log(
        `No products found on page ${currentPage}. Stopping scraping.`
      );
      break;
    }

    // Wait before scraping the next page to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return products;
}

/**
 * Scrapes the product description from an Amazon product page.
 * @param {string} productUrl - The URL of the product page.
 * @returns {Promise<string>} The product description text.
 */
async function scrapeProductDescription(productUrl) {
  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
    timeout: 60000,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  let description = "";

  // Set navigation and operation timeouts
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);

  try {
    // Navigate to the product page
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 60000 });
    // Extract the product description from the page
    description = await page.evaluate(() => {
      const descElement =
        document.getElementById("productDescription") ||
        document.querySelector("#feature-bullets ul");
      return descElement ? descElement.innerText : "No description available";
    });
  } catch (error) {
    console.error("Error fetching product description:", error);
  } finally {
    // Always close the browser
    await browser.close();
  }

  return description;
}

// Export the main scraping functions for use in other modules
module.exports = { scrapeAmazon, scrapeProductDescription };
