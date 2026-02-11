import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NewsCard from '../components/news/NewsCard';

const News = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('All');

    const categories = ['All', 'Stocks', 'Economy', 'Global', 'Crypto'];

    useEffect(() => {
        fetchNews();
    }, [category]);

    const fetchNews = async () => {
        setLoading(true);
        setError('');
        try {
            // Assuming layout uses a proxy setup or direct URL. Package.json had proxy.
            // Category mapping: 
            // All -> business (default in backend)
            // Stocks -> business
            // Economy -> business
            // Global -> global
            // Crypto -> crypto

            // Send 'All' to backend to let it decide the best endpoint
            const queryParam = category;
            const response = await axios.get(`/api/news?category=${queryParam}`);
            setNews(response.data);
        } catch (err) {
            setError('Failed to load market news. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={styles.heading}>Daily Market News</h1>
                    <a href="/dashboard" style={styles.backButton}>Back to Dashboard</a>
                </div>
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
            </div>

            {loading ? (
                <div style={styles.loading}>
                    <div className="spinner"></div>
                    <p>Loading market updates...</p>
                </div>
            ) : error ? (
                <div className="error-message">
                    {error}
                </div>
            ) : (
                <div style={styles.grid}>
                    {news.map((item, index) => (
                        <NewsCard key={index} article={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

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
    }
};

export default News;
