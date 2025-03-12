import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import Login from "./Login";
import ProfessorDashboard from "./ProfessorDashboard";
import MonitorDashboard from "./MonitorDashboard";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log("Estado de autenticação alterado:", currentUser);

      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "usuarios ", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          console.log("Papel do usuário:", userSnap.data().role);
          setRole(userSnap.data().role);
        } else {
          console.log("Papel do usuário não encontrado.");
          setRole(null);
        }
      } else {
        console.log("Nenhum usuário logado.");
        setUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando...</p>;

  console.log("Usuário atual:", user);
  console.log("Papel atual:", role);

  return (
    
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <Login />
            ) : role === "admin" ? (
              <Navigate to="/admin" />
            ) : role === "professor" ? (
              <Navigate to="/turma/someDefaultClassId" />
            ) : role === "monitor" ? (
              <Navigate to="/monitor" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/monitor"
          element={
            user && role === "monitor" ? (
              <MonitorDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/turma/:turmaId"
          element={
            user && role === "professor" ? (
              <ProfessorDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    
  );
}

export default App;