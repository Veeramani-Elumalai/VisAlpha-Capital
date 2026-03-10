import React from 'react';

const ReasonModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        <span style={{ color: data.type === 'positive' ? '#22c55e' : '#ef4444' }}>
                            {data.stock}
                        </span> - Analysis
                    </h2>
                    <button style={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                <div style={styles.body}>
                    <div style={styles.section}>
                        <h4 style={styles.sectionLabel}>Context Headline</h4>
                        <p style={styles.headlineText}>{data.headline}</p>
                        {data.url && (
                            <a
                                href={data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={styles.articleLink}
                            >
                                Read Full Article →
                            </a>
                        )}
                    </div>

                    <div style={styles.section}>
                        <h4 style={styles.sectionLabel}>AI Explanation</h4>
                        <p style={styles.explanationText}>{data.reason}</p>
                    </div>

                    <div style={styles.section}>
                        <h4 style={styles.sectionLabel}>Suggested Action</h4>
                        <div style={{
                            ...styles.actionBadge,
                            backgroundColor: data.type === 'positive' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: data.type === 'positive' ? '#22c55e' : '#ef4444',
                            borderColor: data.type === 'positive' ? '#22c55e' : '#ef4444'
                        }}>
                            {data.suggestedAction}
                        </div>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button style={styles.doneBtn} onClick={onClose}>Done</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '500px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid #334155',
        animation: 'modalSlideIn 0.3s ease-out',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #334155',
        paddingBottom: '12px',
    },
    title: {
        margin: 0,
        fontSize: '20px',
        color: '#f8fafc',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '4px',
    },
    body: {
        color: '#cbd5e1',
    },
    section: {
        marginBottom: '20px',
    },
    sectionLabel: {
        fontSize: '12px',
        textTransform: 'uppercase',
        color: '#64748b',
        letterSpacing: '0.05em',
        marginBottom: '8px',
    },
    headlineText: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#f1f5f9',
        lineHeight: '1.4',
    },
    explanationText: {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#94a3b8',
    },
    actionBadge: {
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '700',
        border: '1px solid',
    },
    footer: {
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    doneBtn: {
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    articleLink: {
        display: 'inline-block',
        marginTop: '8px',
        color: '#3b82f6',
        fontSize: '13px',
        textDecoration: 'none',
        fontWeight: '500',
    }
};

export default ReasonModal;
