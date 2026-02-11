import React from 'react';

const NewsCard = ({ article }) => {
    const { title, description, url, imageUrl, source, publishedAt } = article;

    const fallbackImage = 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <div style={styles.card}>
            <img
                src={imageUrl || fallbackImage}
                alt={title}
                style={styles.image}
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
            />
            <div style={styles.content}>
                <span style={styles.source}>{source} • {new Date(publishedAt).toLocaleDateString()}</span>
                <h3 style={styles.title}>{title}</h3>
                <p style={styles.description}>{description ? description.slice(0, 100) + '...' : 'No description available.'}</p>
                <a href={url} target="_blank" rel="noopener noreferrer" style={styles.button}>
                    Read More
                </a>
            </div>
        </div>
    );
};

const styles = {
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
    source: {
        fontSize: '12px',
        color: '#94a3b8',
        marginBottom: '8px',
        display: 'block',
    },
    title: {
        fontSize: '18px',
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
    }
};

export default NewsCard;
