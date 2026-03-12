import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-logo">VisAlpha Capital</div>
        <div className="landing-links">
          <Link to="/login" className="landing-login-btn">
            Log In
          </Link>
          <Link to="/register" className="landing-register-btn">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="landing-main">
        <div className="hero-section">
          <h1 className="hero-title">
            Intelligent Financial Insights <br />
            <span className="highlight">Powered by AI</span>
          </h1>
          <p className="hero-subtitle">
            Uncover alpha with our advanced market screener, sector analysis, and AI-driven daily reports. Take control of your portfolio today.
          </p>
          <div className="hero-cta-group">
            <Link to="/register" className="cta-primary">
              Start Your Free Trial
            </Link>
            <Link to="/screener" className="cta-secondary">
              Explore Screener
            </Link>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Advanced Screener</h3>
            <p>Filter thousands of stocks using complex metrics and proprietary algorithms to find hidden gems.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Advisor</h3>
            <p>Get personalized insights and portfolio recommendations driven by our state-of-the-art AI models.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📰</div>
            <h3>Daily Reports</h3>
            <p>Stay ahead of the market with AI-generated daily summaries covering major sectors and breaking news.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>AI Stock Analysis</h3>
            <p>Get insights with our deterministic engine works with fundamental data for any stock.</p>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} VisAlpha Capital. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
