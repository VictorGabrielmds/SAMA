import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFirestore, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

function ProfessorDashboard() {
  const { turmaId } = useParams();
  const [turma, setTurma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const db = getFirestore();
  const navigate = useNavigate();

  // Efeitos sonoros
  const somPedirAjuda = new Audio("/sounds/pedir-ajuda.mp3");
  const somMonitorCaminho = new Audio("/sounds/monitor-caminho.mp3");

  const getNomeFromEmail = (email) => {
    return email.split("@")[0];
  };

  const atualizarNomeProfessor = async (email) => {
    const nome = getNomeFromEmail(email);
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, { professor: nome });
      console.log("Nome do professor atualizado:", nome);
    } catch (error) {
      console.error("Erro ao atualizar nome do professor:", error);
    }
  };

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
            somPedirAjuda.play();
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
      await updateDoc(turmaRef, {
        professorAtivo: null,
      });
      await signOut(auth);
      console.log("Professor deslogado com sucesso.");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div>
      <h1>Painel do Professor - Turma {turmaId}</h1>
      <button onClick={handleLogout} style={{ position: "absolute", top: 10, right: 10 }}>
        Sair
      </button>
      {turma && (
        <div>
          <h2>Professor: {turma.professor}</h2>

          {turma.aulaAtiva ? (
            <button onClick={encerrarAula}>Encerrar Aula</button>
          ) : (
            <button onClick={iniciarAula}>Iniciar Aula</button>
          )}

          {turma.aulaAtiva && (
            <button onClick={pedirAjuda} disabled={turma.precisaAjuda}>
              {turma.precisaAjuda ? "Ajuda Solicitada" : "Pedir Ajuda"}
            </button>
          )}

          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  );
}

export default ProfessorDashboard;