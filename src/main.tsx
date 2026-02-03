import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Detectar recuperação de senha ANTES do React montar
// Isso resolve a race condition onde o Supabase processa o token antes do React
const hash = window.location.hash;
const search = window.location.search;

if (hash.includes('type=recovery') || search.includes('type=recovery')) {
  sessionStorage.setItem('password_recovery_mode', 'true');
  
  // Redirecionar para /reset-password se não estiver lá
  if (!window.location.pathname.includes('reset-password')) {
    window.history.replaceState(null, '', '/reset-password' + hash);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
