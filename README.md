# Web Scraper

A simple and efficient web scraping tool built with Node.js. This project allows users to extract data from web pages and automate data collection tasks. **Currently, it only works for Amazon.** Support for more platforms is needed and planned for future releases. Designed for flexibility and ease of use, it can be customized for various scraping needs.

## Features

## API Endpoints

Your project exposes a REST API. Here are the available endpoints:

- `GET /api/products?q=SEARCH_TERM&pages=NUMBER`  
  Returns a list of products for the given search term and number of pages.

- `GET /api/product-description?url=PRODUCT_URL`  
  Returns the description for a specific product URL.

## Example Requests

```sh
curl "http://localhost:8080/api/products?q=laptop&pages=2"
curl "http://localhost:8080/api/product-description?url=https://www.amazon.in/dp/B09XYZ1234"
```

## Environment Variables

- `PORT`: Port for the server (default: 8080)
- `PUPPETEER_EXECUTABLE_PATH`: Path to Chromium/Chrome for Puppeteer (set automatically in Docker)

## Troubleshooting

- Ensure Chromium is installed if running outside Docker.
- If scraping fails, check for changes in Amazon's page structure.
- For rate limits or blocks, try increasing delays or using proxies.

## Roadmap

- Add support for more e-commerce sites
- Export results to CSV/Excel
- Add authentication for API
- Improve error handling and logging

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (optional, for containerized usage)

### Installation

Clone the repository:

```sh
git clone https://github.com/HUmnanANirudh/Web_Scraper.git
cd Web_Scraper
```

Install dependencies:

```sh
npm install
```

### Usage

#### Run Locally

Edit `scraper.js` to configure your scraping logic, then run:

```sh
node scraper.js
```

#### Using Docker

Build and run the Docker container:

```sh
docker build -t web-scraper .
docker run --rm web-scraper
```

### Configuration

- Modify `scraper.js` to set the target URL and scraping logic.
- Output is saved or printed in JSON format.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, open an issue or contact via GitHub.
