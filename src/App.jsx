import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import './App.css';

import Login from "./login";
import ProfessorTurmas from "./ProfessorTurmas";
import ProfessorDashboard from "./ProfessorDashboard";
import MonitorDashboard from "./MonitorDashboard";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const db = getFirestore();

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "usuarios ", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setRole(userSnap.data().role);
        } else {
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando...</p>;

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
            <Navigate to="/professor-turmas" />
          ) : role === "monitor" ? (
            <Navigate to="/monitor" />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/professor-turmas"
        element={
          user && role === "professor" ? (
            <ProfessorTurmas />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/turma/:turmaId"
        element={
          user && role === "professor" ? (
            <ProfessorDashboard />
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