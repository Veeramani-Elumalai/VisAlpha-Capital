import axios from 'axios';

export const getNews = async (req, res) => {
    try {
        const { category } = req.query;
        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "NEWS_API_KEY is missing in server environment" });
        }

        // ── Stock Industry: fetch top headlines across major industries ──
        if (category === 'StockIndustry') {
            const industries = [
                { label: 'Technology', q: 'technology stocks' },
                { label: 'Healthcare', q: 'healthcare pharma stocks' },
                { label: 'Energy', q: 'energy oil gas stocks' },
                { label: 'Finance', q: 'banking financial stocks' },
                { label: 'Consumer', q: 'consumer retail stocks' },
                { label: 'Auto', q: 'automobile automotive stocks' },
            ];

            // Fetch top-3 from each industry in parallel
            const requests = industries.map(ind =>
                axios.get(
                    `https://newsapi.org/v2/everything?q=${encodeURIComponent(ind.q)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${apiKey}`
                ).then(r => ({
                    label: ind.label,
                    articles: r.data.articles || []
                })).catch(() => ({ label: ind.label, articles: [] }))
            );

            const results = await Promise.all(requests);

            // Flatten, tag each article with its industry, deduplicate by title, limit to 10
            const seen = new Set();
            const combined = [];

            for (const { label, articles } of results) {
                for (const article of articles) {
                    if (!article.title || seen.has(article.title)) continue;
                    seen.add(article.title);
                    combined.push({
                        title: article.title,
                        description: article.description,
                        url: article.url,
                        imageUrl: article.urlToImage,
                        source: article.source?.name || 'Unknown',
                        publishedAt: article.publishedAt,
                        industry: label,
                    });
                    if (combined.length === 20) break;
                }
                if (combined.length === 20) break;
            }

            return res.json(combined);
        }

        // ── Standard categories ──
        let url = `https://newsapi.org/v2/top-headlines?country=in&category=business&apiKey=${apiKey}`;

        if (category) {
            if (category === 'All') {
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
                url = `https://newsapi.org/v2/top-headlines?country=in&category=${category.toLowerCase()}&apiKey=${apiKey}`;
            }
        }

        const response = await axios.get(url);
        const articles = response.data.articles || [];

        const news = articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            imageUrl: article.urlToImage,
            source: article.source?.name || 'Unknown',
            publishedAt: article.publishedAt,
        }));

        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
};
