import { useState } from "react";
import { loginUser } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(email, password);

      // save token
      localStorage.setItem("token", res.token);

      setMsg("Login Successful");
      setTimeout(() => navigate("/dashboard"), 500);
    } catch (err) {
      setMsg(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link to="/" className="auth-logo">VisAlpha Capital</Link>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        <div className="divider">OR</div>

        <div className="google-login-container">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const googleToken = credentialResponse.credential;
              
              try {
                const res = await axios.post("http://localhost:5000/api/auth/google", {
                  token: googleToken
                });

                localStorage.setItem("token", res.data.token);
                navigate("/dashboard");
              } catch (err) {
                setMsg("Google Login Failed");
              }
            }}
            onError={() => {
              setMsg("Google Login Failed");
            }}
          />
        </div>

        {msg && <div className={`auth-message ${msg.includes("Successful") ? "success" : ""}`}>{msg}</div>}

        <p className="auth-link-text">
          Don't have an account?
          <Link to="/register" className="auth-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
