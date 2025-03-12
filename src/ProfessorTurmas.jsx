import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

function ProfessorTurmas() {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const db = getFirestore();
  const navigate = useNavigate();

  // Carrega a lista de turmas do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "turmas"), (snapshot) => {
      const turmasList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTurmas(turmasList);
      setLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [db]);

  // Função para entrar em uma turma
  const entrarNaTurma = async (turmaId) => {
    const turmaRef = doc(db, "turmas", turmaId);

    try {
      // Verifica se a turma já tem um professor ativo
      const turmaSnap = await getDoc(turmaRef);
      if (turmaSnap.exists() && turmaSnap.data().professorAtivo) {
        if (turmaSnap.data().professorAtivo !== auth.currentUser.email) {
          setError("Já há um professor ativo nesta turma.");
          return;
        }
      }

      // Registra o professor como ativo na turma
      await updateDoc(turmaRef, {
        professorAtivo: auth.currentUser.email.split("@")[0], // Usa o e-mail do professor como identificador
      });

      // Redireciona para o painel da turma
      navigate(`/turma/${turmaId}`);
    } catch (error) {
      console.error("Erro ao entrar na turma:", error);
      setError("Erro ao entrar na turma.");
    }
  };

  // Função para sair (logout)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Professor deslogado com sucesso.");
      navigate("/login"); // Redireciona para a página de login
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
      <h1>Painel do Professor</h1>
      <button onClick={handleLogout} style={{ position: "absolute", top: 10, right: 10 }}>
        Sair
      </button>

      <h2>Turmas Disponíveis</h2>
      <ul>
        {turmas.map((turma) => (
          <li key={turma.id}>
            <button onClick={() => entrarNaTurma(turma.id)}>
              Turma {turma.id} - Professor: {turma.professorAtivo || "Sem professor"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProfessorTurmas;