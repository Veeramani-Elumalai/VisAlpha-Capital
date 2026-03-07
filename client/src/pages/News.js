import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsCard from '../components/news/NewsCard';

// Industry badge colour map
const INDUSTRY_COLORS = {
    Technology: '#6366f1',
    Healthcare: '#10b981',
    Energy: '#f59e0b',
    Finance: '#3b82f6',
    Consumer: '#ec4899',
    Auto: '#8b5cf6',
};

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('All');

    const categories = ['All', 'Stocks', 'Stock Industry', 'Economy', 'Global', 'Crypto'];

    useEffect(() => {
        fetchNews();
    }, [category]);

    const fetchNews = async () => {
        setLoading(true);
        setError('');
        try {
            // Map display label → query param
            const paramMap = {
                'Stock Industry': 'StockIndustry',
            };
            const queryParam = paramMap[category] || category;
            const response = await axios.get(`/api/news?category=${queryParam}`);
            setNews(response.data);
        } catch (err) {
            setError('Failed to load market news. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const isIndustryView = category === 'Stock Industry';

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={styles.heading}>Daily Market News</h1>
                    <a href="/dashboard" style={styles.backButton}>Back to Dashboard</a>
                </div>

                {/* Category tab pills */}
                <div style={styles.tabs}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            style={{ ...styles.tab, ...(category === cat ? styles.activeTab : {}) }}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Sub-heading for Stock Industry */}
                {isIndustryView && !loading && !error && (
                    <p style={styles.subHeading}>
                        Top&nbsp;10 headlines across Technology, Healthcare, Energy, Finance, Consumer &amp; Auto sectors
                    </p>
                )}
            </div>

            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Loading market updates...</p>
                </div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div style={styles.grid}>
                    {news.map((item, index) => (
                        isIndustryView
                            ? <IndustryNewsCard key={index} article={item} />
                            : <NewsCard key={index} article={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── Inline card for Stock Industry view ── */
const IndustryNewsCard = ({ article }) => {
    const { title, description, url, imageUrl, source, publishedAt, industry } = article;
    const fallbackImage = 'https://via.placeholder.com/300x200?text=No+Image';
    const badgeColor = INDUSTRY_COLORS[industry] || '#475569';

    return (
        <div style={cardStyles.card}>
            <img
                src={imageUrl || fallbackImage}
                alt={title}
                style={cardStyles.image}
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
            />
            <div style={cardStyles.content}>
                <div style={cardStyles.meta}>
                    <span
                        style={{ ...cardStyles.industryBadge, backgroundColor: badgeColor + '26', color: badgeColor, borderColor: badgeColor + '55' }}
                    >
                        {industry}
                    </span>
                    <span style={cardStyles.source}>
                        {source} &bull; {new Date(publishedAt).toLocaleDateString()}
                    </span>
                </div>
                <h3 style={cardStyles.title}>{title}</h3>
                <p style={cardStyles.description}>
                    {description ? description.slice(0, 100) + '…' : 'No description available.'}
                </p>
                <a href={url} target="_blank" rel="noopener noreferrer" style={cardStyles.button}>
                    Read More
                </a>
            </div>
        </div>
    );
};

/* ── Page-level styles ── */
const styles = {
    container: {
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
    },
    header: {
        marginBottom: '32px',
        borderBottom: '1px solid #334155',
        paddingBottom: '16px',
    },
    heading: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: '24px',
    },
    tabs: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },
    tab: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        border: '1px solid #475569',
        borderRadius: '20px',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s',
    },
    activeTab: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        color: 'white',
    },
    subHeading: {
        marginTop: '14px',
        fontSize: '13px',
        color: '#64748b',
        fontStyle: 'italic',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: '#94a3b8',
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: '#475569',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
    },
};

/* ── IndustryNewsCard styles ── */
const cardStyles = {
    card: {
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    image: {
        width: '100%',
        height: '180px',
        objectFit: 'cover',
    },
    content: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
    },
    meta: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '10px',
        flexWrap: 'wrap',
    },
    industryBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 10px',
        borderRadius: '12px',
        border: '1px solid',
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
        flexShrink: 0,
    },
    source: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    title: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: '8px',
        lineHeight: '1.4',
    },
    description: {
        fontSize: '14px',
        color: '#cbd5e1',
        marginBottom: '16px',
        flexGrow: 1,
    },
    button: {
        display: 'inline-block',
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        marginTop: 'auto',
    },
};

export default News;
