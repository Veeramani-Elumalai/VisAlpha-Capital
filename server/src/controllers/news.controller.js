import axios from 'axios';

export const getNews = async (req, res) => {
    try {
        const { category } = req.query;
        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "NEWS_API_KEY is missing in server environment" });
        }

        let url = `https://newsapi.org/v2/top-headlines?country=in&category=business&apiKey=${apiKey}`;

        // If a specific category is requested
        if (category) {
            if (category === 'All') {
                // Use /everything for a broader mix of market news
                url = `https://newsapi.org/v2/everything?q=market&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
            } else if (category === 'Stocks') {
                url = `https://newsapi.org/v2/everything?q=stock%20market&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
            } else if (category === 'Economy') {
                url = `https://newsapi.org/v2/everything?q=economy&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
            } else if (category === 'Global') {
                url = `https://newsapi.org/v2/everything?q=finance&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
            } else if (category === 'Crypto') {
                url = `https://newsapi.org/v2/everything?q=crypto&language=en&sortBy=publishedAt&apiKey=${apiKey}`;
            } else if (['business', 'technology', 'general', 'health', 'science', 'sports', 'entertainment'].includes(category.toLowerCase())) {
                // Fallback for standard categories if we add them later to UI
                url = `https://newsapi.org/v2/top-headlines?country=in&category=${category.toLowerCase()}&apiKey=${apiKey}`;
            }
        }

        const response = await axios.get(url);
        const articles = response.data.articles || [];

        // Simplify response structure
        const news = articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.urlToImage,
            source: article.source.name,
            publishedAt: article.publishedAt
        }));

        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
};
