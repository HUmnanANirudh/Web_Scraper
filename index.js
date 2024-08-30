const express = require('express');
const { scrapeAmazon, scrapeProductDescription } = require('./scraper'); // Ensure this path is correct

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Endpoint to fetch products
app.get('/api/products', async (req, res) => {
    const query = req.query.q;
    const pages = parseInt(req.query.pages) || 1; // Default to 1 page if not specified

    if (!query) {
        return res.status(400).json({ message: 'Query parameter `q` is required' });
    }

    try {
        const products = await scrapeAmazon(query, pages);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error scraping Amazon', error: error.message });
    }
});

// Endpoint to fetch product description
app.get('/api/product-description', async (req, res) => {
    const productUrl = req.query.url;

    if (!productUrl) {
        return res.status(400).json({ message: 'Query parameter `url` is required' });
    }

    try {
        const description = await scrapeProductDescription(productUrl);
        res.json({ description });
    } catch (error) {
        res.status(500).json({ message: 'Error scraping product description', error: error.message });
    }
});

app.listen(port);
