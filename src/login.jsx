import React, { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login({ onLogin = () => {} }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email+"@gmail.com", password);
      onLogin(userCredential.user);
      navigate("/");
    } catch (err) {
      setError("Erro ao fazer login. Verifique suas credenciais.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "0 auto", padding: "20px" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Nome"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          
        />
        <button
          type="submit"
          disabled={loading}
          
        >
          {loading ? "Carregando..." : "Entrar"}
        </button>
        
      </form>
    </div>
  );
}

export default Login;