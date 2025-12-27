import { useState } from "react";
import { loginUser } from "../services/authService";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Link } from "react-router-dom";



export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(email, password);

      // save token
      localStorage.setItem("token", res.token);

      setMsg("Login Successful");
      window.location.href = "/dashboard";
    } catch (err) {
      setMsg(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h2>VisAlpha Capital Login</h2>

        <input
          type="email"
          placeholder="Email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button style={styles.button} type="submit">
          Login
        </button>

        <p style={{ marginTop: "10px" }}>
          Don't have an account?
          <Link to="/register" style={{ color: "#2563eb", textDecoration: "none" }}>
            Create one
          </Link>
        </p>


        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const googleToken = credentialResponse.credential;
            
            try {
              const res = await axios.post("http://localhost:5000/api/auth/google", {
                token: googleToken
              });

              localStorage.setItem("token", res.data.token);
              window.location.href = "/dashboard";
            } catch (err) {
              setMsg("Google Login Failed");
            }
          }}
          onError={() => {
            setMsg("Google Login Failed");
          }}
        />


        {msg && <p>{msg}</p>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a"
  },
  card: {
    padding: "30px",
    borderRadius: "10px",
    background: "white",
    width: "350px",
    textAlign: "center"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0"
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "5px"
  }
};
