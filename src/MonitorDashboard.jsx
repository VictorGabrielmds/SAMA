import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

function MonitorDashboard() {
  const [turmas, setTurmas] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    console.log("📡 Iniciando snapshot de turmas...");

    if (!db) return;

    const unsubscribe = onSnapshot(collection(db, "turmas"), (snapshot) => {
      const turmasAtivas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📊 Atualizando turmas:", turmasAtivas);
      setTurmas(turmasAtivas);
    });

    return () => {
      console.log("🛑 Desinscrevendo snapshot de turmas...");
      unsubscribe();
    };
  }, [db]);

  const responderAjuda = async (turmaId) => {
    await updateDoc(doc(db, "turmas", turmaId), {
      monitorIndo: true, // Apenas define monitorIndo como true
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