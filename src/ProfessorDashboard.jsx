import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

import alertSound from "../public/sounds/monitor-caminho.mp3";
import logoB from "../src/assets/img/logo-branca.png";
import logo from "../src/assets/img/logo.png";

function ProfessorDashboard() {
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const db = getFirestore();
  const navigate = useNavigate();


  const somMonitorCaminho = new Audio(alertSound);

  const getNomeFromEmail = (email) => {
    return email.split("@")[0];
  };

  const capitalize = (str) => {
    if (!str || typeof str !== "string") return ""; // Verifica se é uma string válida
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  useEffect(() => {
    if (!turmaId) {
      setError("ID da turma não fornecido.");
      setLoading(false);
      return;
    }

    const turmaRef = doc(db, "turmas", turmaId);

    getDoc(turmaRef).then((docSnap) => {
      if (!docSnap.exists()) {
        setError("Turma não encontrada.");
        setLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(turmaRef, (turmaSnap) => {
        if (turmaSnap.exists()) {
          const data = turmaSnap.data();
          setTurma(data);
          setLoading(false);

          if (data.precisaAjuda && !data.monitorIndo) {
            setStatus("Monitor acionado");
            // somPedirAjuda.play();
          } else if (data.precisaAjuda && data.monitorIndo) {
            setStatus("Monitor a caminho");
            somMonitorCaminho.play();
          } else if (!data.precisaAjuda && !data.monitorIndo && status === "Monitor a caminho") {
            setStatus("Problema resolvido");
            setTimeout(() => setStatus(""), 3000);
          }
        } else {
          setError("Turma não encontrada.");
          setLoading(false);
        }
      });

      return () => unsubscribe();
    });
  }, [turmaId, db, status]);

  const iniciarAula = async () => {
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, { aulaAtiva: true });
      console.log("Aula iniciada com sucesso!");
    } catch (error) {
      console.error("Erro ao iniciar aula:", error);
      setError("Erro ao iniciar aula.");
    }
  };

  const encerrarAula = async () => {
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, {
        aulaAtiva: false,
        professorAtivo: null,
      });
      console.log("Aula encerrada com sucesso!");
      navigate("/professor-turmas");
    } catch (error) {
      console.error("Erro ao encerrar aula:", error);
      setError("Erro ao encerrar aula.");
    }
  };

  const pedirAjuda = async () => {
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, { precisaAjuda: true });
      console.log("Ajuda solicitada com sucesso!");
    } catch (error) {
      console.error("Erro ao pedir ajuda:", error);
      setError("Erro ao pedir ajuda.");
    }
  };


  const handleLogout = async () => {
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, { professorAtivo: null });
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ height:"100vh", display: "flex", gap: "16px"}}>
      <div className="header">
        <div>
          <img style={{ marginBottom:"24px"}} className="logo" src={logo} alt="" />
          <p>Turma {turmaId}</p>
          <p>Professor: {capitalize(turma.professorAtivo)}</p>
        </div> 
        <button className="logout" onClick={handleLogout}>
            Sair
        </button>
      </div>
      
      <div className="dashboard">
        <div className="dashboard-title">
          <h1>Painel do Professor</h1>
        </div>
        
        {turma && (
        
        <div className="dashboard-content" style={{ height:"100vh", textAlign:"center"}}>

          {turma.aulaAtiva && (
            <div>
              <div className="gradient-button-bg">  
                <div class="button-wrapper">
                  <button className="gradient-button" onClick={pedirAjuda} disabled={turma.precisaAjuda}>
                    <span className="button-text">{turma.precisaAjuda ? "Ajuda Solicitada" : "Pedir Ajuda"}</span>
                  </button>
                </div>
              </div>
              <div className="status-content">
                <div class="alert-wrapper">
                  <div className="gradient-alert" onClick={pedirAjuda} disabled={turma.precisaAjuda}> 
                </div>
              </div>
              <p style={{ visibility: status ? "visible" : "hidden", ativo: status ? 'sim' : 'nao' }}>
                {status ? status : "Monitor Acionado"}
              </p>
            </div>
            </div>
          )}
          
          {turma.aulaAtiva ? (
            <div className="encerrar-aula">
              <button onClick={encerrarAula}>Encerrar Aula</button>

            </div>  
          ) : (
            <ul>
              <li>
                <button onClick={iniciarAula}>Iniciar Aula</button>
              </li>
              <li>
                <button onClick={encerrarAula}>Sair da Sala</button>
              </li>
            </ul>
          )}
          
        </div>
        
      )}
      </div> 
    </div>
  );
}

export default ProfessorDashboard;