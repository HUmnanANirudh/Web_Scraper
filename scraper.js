const puppeteer = require('puppeteer');

const MAX_RETRIES = 3;
const BASE_DELAY = 5000;

async function retryOperation(operation, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed. Error: ${error.message}`);
            if (i === retries - 1) throw error;
            const delay = BASE_DELAY * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
        ],
        defaultViewport: null,
        protocolTimeout: 180000,
    });
}

async function scrapePage(url) {
    let browser;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120000);
        await page.setDefaultTimeout(120000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await retryOperation(async () => {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
        });

        const products = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.s-main-slot .s-result-item'));
            return items.map(item => {
                const titleElement = item.querySelector('h2');
                const priceElement = item.querySelector('.a-price-whole');
                const imageElement = item.querySelector('.s-image');
                const linkElement = titleElement ? titleElement.querySelector('a') : null;

                const title = titleElement ? titleElement.innerText : null;
                const price = priceElement ? priceElement.innerText : null;
                const image = imageElement ? imageElement.src : null;
                const link = linkElement ? `https://www.amazon.in${linkElement.getAttribute('href')}` : null;

                return title && price && image ? { title, price, image, link } : null;
            }).filter(product => product !== null);
        });

        return products;
    } catch (error) {
        console.error('Error scraping page:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

async function scrapeAmazon(query, maxPages = 5) {
    const products = [];

    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
        console.log(`Scraping page ${currentPage}...`);
        const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&page=${currentPage}`;
        
        const pageProducts = await scrapePage(url);
        products.push(...pageProducts);

        if (pageProducts.length === 0) {
            console.log(`No products found on page ${currentPage}. Stopping scraping.`);
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return products;
}

async function scrapeProductDescription(productUrl) {
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

  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);

  try {
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 60000 });
    description = await page.evaluate(() => {
      const descElement =
        document.getElementById("productDescription") ||
        document.querySelector("#feature-bullets ul");
      return descElement ? descElement.innerText : "No description available";
    });
  } catch (error) {
    console.error("Error fetching product description:", error);
  } finally {
    await browser.close();
  }

  return description;
}

module.exports = { scrapeAmazon, scrapeProductDescription };
