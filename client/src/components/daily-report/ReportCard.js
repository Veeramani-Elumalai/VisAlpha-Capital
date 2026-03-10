import React from 'react';

const ReportCard = ({ signal, type, onShowReason }) => {
    const isPositive = type === 'positive';
    const color = isPositive ? '#22c55e' : '#ef4444';

    return (
        <div style={styles.card}>
            <div style={styles.topRow}>
                <div style={{ ...styles.ticker, color }}>{signal.stock}</div>
                <div style={{
                    ...styles.typeBadge,
                    backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: color,
                    borderColor: color + '44'
                }}>
                    {isPositive ? 'Bullish' : 'Bearish'}
                </div>
            </div>

            <h4 style={styles.headline}>{signal.headline}</h4>

            <button
                style={styles.reasonBtn}
                onClick={() => onShowReason({ ...signal, type })}
            >
                View Analysis
            </button>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: '#0f172a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #1e293b',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'default',
    },
    topRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    ticker: {
        fontSize: '18px',
        fontWeight: '800',
        letterSpacing: '0.05em',
    },
    typeBadge: {
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        border: '1px solid',
    },
    headline: {
        margin: '0 0 20px 0',
        fontSize: '15px',
        color: '#f8fafc',
        lineHeight: '1.4',
        fontWeight: '500',
        flexGrow: 1,
    },
    reasonBtn: {
        backgroundColor: '#1e293b',
        color: '#94a3b8',
        border: '1px solid #334155',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'center',
    }
};

export default ReportCard;
