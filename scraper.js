const { chromium } = require('playwright');

async function scrapeAmazon(query, maxPages = 5) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const products = [];

    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
        console.log(`Scraping page ${currentPage}...`);

        // Navigate to the current page
        await page.goto(`https://www.amazon.in/s?k=${query}&page=${currentPage}`, { waitUntil: 'networkidle2' });

        // Extract product data
        const pageProducts = await page.evaluate(() => {
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
            }).filter(product => product !== null); // Filter out null values
        });

        products.push(...pageProducts);

        await new Promise(resolve => setTimeout(resolve, 2000));
        // Delay for 2 seconds before scraping the next page
    }

    await browser.close();
    return products;
}

async function scrapeProductDescription(productUrl) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(productUrl, { waitUntil: 'networkidle2' });

    // Extract product description
    const description = await page.evaluate(() => {
        const descElement = document.getElementById('productDescription') || document.querySelector('#feature-bullets ul');
        return descElement ? descElement.innerText : 'No description available';
    });

    await browser.close();
    return description;
}

module.exports = { scrapeAmazon, scrapeProductDescription };
