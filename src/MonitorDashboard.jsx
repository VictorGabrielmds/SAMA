import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

// Importe o arquivo de áudio (coloque o arquivo na pasta public/sounds)
import alertSound from "../public/sounds/monitor-alerta.mp3"; // Ajuste o caminho conforme necessário

function MonitorDashboard() {
  const [turmas, setTurmas] = useState([]);
  const db = getFirestore();
  const [alertedTurmas, setAlertedTurmas] = useState(new Set()); // Controla turmas que já alertaram

  // Configura o áudio
  const audio = new Audio(alertSound);

  useEffect(() => {
    console.log("📡 Iniciando snapshot de turmas...");

    const unsubscribe = onSnapshot(collection(db, "turmas"), (snapshot) => {
      const turmasAtivas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Toca o som para novas solicitações de ajuda
      turmasAtivas.forEach((turma) => {
        if (turma.precisaAjuda && !turma.monitorIndo && !alertedTurmas.has(turma.id)) {
          audio.play();
          setAlertedTurmas((prev) => new Set([...prev, turma.id]));
        }
      });

      console.log("📊 Atualizando turmas:", turmasAtivas);
      setTurmas(turmasAtivas);
    });

    return () => {
      console.log("🛑 Desinscrevendo snapshot de turmas...");
      unsubscribe();
    };
  }, [db, alertedTurmas]);

  const responderAjuda = async (turmaId) => {
    await updateDoc(doc(db, "turmas", turmaId), {
      monitorIndo: true,
    });
    
    // Remove a turma da lista de alertas
    setAlertedTurmas((prev) => {
      const newSet = new Set(prev);
      newSet.delete(turmaId);
      return newSet;
    });
  };

  const finalizarAjuda = async (turmaId) => {
    await updateDoc(doc(db, "turmas", turmaId), {
      precisaAjuda: false,
      monitorIndo: false,
    });
  };

  const encerrarAula = async (turmaId) => {
    await updateDoc(doc(db, "turmas", turmaId), {
      aulaAtiva: false,
      precisaAjuda: false,
      monitorIndo: false,
    });
  };

  const handleLogout = async () => {
    console.log("Saindo...");
    await signOut(auth);
  };

  return (
    <div>
      <h1>Painel de Monitoramento</h1>
      <button onClick={handleLogout} style={{ position: "absolute", top: 10, right: 10 }}>
        Sair
      </button>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {turmas.map((turma) => (
          <div key={turma.id} style={{ border: "1px solid black", padding: "10px" }}>
            <h2>Turma {turma.id}</h2>
            <h4>{turma.professor}</h4>
            <p>{turma.aulaAtiva ? "Aula Iniciada ✅" : "Aula Não Iniciada ❌"}</p>

            {turma.precisaAjuda && !turma.monitorIndo && (
              <button onClick={() => responderAjuda(turma.id)}>Estou indo</button>
            )}

            {turma.monitorIndo && (
              <button onClick={() => finalizarAjuda(turma.id)}>Problema Resolvido</button>
            )}

            {turma.aulaAtiva && (
              <button onClick={() => encerrarAula(turma.id)} style={{ marginTop: "10px" }}>
                Encerrar Aula
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonitorDashboard;