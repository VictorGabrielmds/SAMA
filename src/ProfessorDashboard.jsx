import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth } from "./firebase"; // Importe signOut corretamente
import { signOut } from "firebase/auth";

function ProfessorDashboard() {
  const { turmaId } = useParams(); // Acessa o turmaId da URL
  const [turma, setTurma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(""); // Estado para controlar o status
  const db = getFirestore();

  // Efeitos sonoros
  const somPedirAjuda = new Audio("/sounds/pedir-ajuda.mp3"); // Caminho para o arquivo de áudio
  const somMonitorCaminho = new Audio("/sounds/monitor-caminho.mp3"); // Caminho para o arquivo de áudio

  // Função para extrair o nome do e-mail (ex: "nome@gmail.com" → "nome")
  const getNomeFromEmail = (email) => {
    return email.split("@")[0]; // Pega a parte antes do "@"
  };

  // Atualiza o campo `professor` no Firestore com o nome do professor
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

  // Observa as mudanças na turma no Firestore em tempo real
  useEffect(() => {
    const turmaRef = doc(db, "turmas", turmaId);

    // Listener para atualizações em tempo real
    const unsubscribe = onSnapshot(turmaRef, (turmaSnap) => {
      if (turmaSnap.exists()) {
        const data = turmaSnap.data();
        setTurma(data);
        setLoading(false);

        // Lógica para atualizar o status e tocar sons
        if (data.precisaAjuda && !data.monitorIndo) {
          setStatus("Monitor acionado");
          somPedirAjuda.play(); // Toca o som de pedir ajuda
        } else if (data.precisaAjuda && data.monitorIndo) {
          setStatus("Monitor a caminho");
          somMonitorCaminho.play(); // Toca o som de monitor a caminho
        } else if (!data.precisaAjuda && !data.monitorIndo && status === "Monitor a caminho") {
          setStatus("Problema resolvido");
          setTimeout(() => setStatus(""), 3000); // Remove a mensagem após 3 segundos
        }
      } else {
        setError("Turma não encontrada.");
        setLoading(false);
      }
    });

    // Atualiza o nome do professor ao carregar o painel
    if (auth.currentUser) {
      atualizarNomeProfessor(auth.currentUser.email);
    }

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [turmaId, db, status]);

  // Atualiza o campo `aulaAtiva` no Firestore para iniciar a aula
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

  // Atualiza o campo `aulaAtiva` no Firestore para encerrar a aula
  const encerrarAula = async () => {
    try {
      const turmaRef = doc(db, "turmas", turmaId);
      await updateDoc(turmaRef, { aulaAtiva: false });
      console.log("Aula encerrada com sucesso!");
    } catch (error) {
      console.error("Erro ao encerrar aula:", error);
      setError("Erro ao encerrar aula.");
    }
  };

  // Atualiza o campo `precisaAjuda` no Firestore
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

  // Função para sair (logout)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Professor deslogado com sucesso.");
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

          {/* Botão para iniciar ou encerrar a aula */}
          {turma.aulaAtiva ? (
            <button onClick={encerrarAula}>Encerrar Aula</button>
          ) : (
            <button onClick={iniciarAula}>Iniciar Aula</button>
          )}

          {/* Botão para pedir ajuda (só aparece se a aula estiver ativa) */}
          {turma.aulaAtiva && (
            <button onClick={pedirAjuda} disabled={turma.precisaAjuda}>
              {turma.precisaAjuda ? "Ajuda Solicitada" : "Pedir Ajuda"}
            </button>
          )}

          {/* Exibe a mensagem de status */}
          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  );
}

export default ProfessorDashboard;