import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const navigate = useNavigate();

  // Estados para o formulário de criação de usuário
  const [nome, setNome] = useState("");
  const [role, setRole] = useState("monitor"); // Valor padrão para o role
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para a lista de usuários
  const [usuarios, setUsuarios] = useState([]);

  // Carrega a lista de usuários do Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "usuarios "), (snapshot) => {
      const usuariosList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usuariosList);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [db]);

  // Verifica se o usuário logado é admin
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      try {
        if (currentUser) {
          const userRef = doc(db, "usuarios ", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setIsAdmin(userSnap.data().role === "admin");
          } else {
            console.log("Documento do usuário não encontrado.");
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
          navigate("/login"); // Redireciona para a página de login
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar o componente
  }, [db, navigate]);

  // Função para realizar o logout
  const handleLogout = async () => {
    try {
      await signOut(auth); // Realiza o logout
      console.log("Usuário deslogado com sucesso.");
      navigate("/login"); // Redireciona para a página de login
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Função para criar um novo usuário
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!nome || !password || !role) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    const email = `${nome.toLowerCase().replace(/\s+/g, "")}@gmail.com`; // Gera o e-mail

    try {
      // Salva as credenciais do admin atual
      const adminUser = auth.currentUser;
      const adminEmail = adminUser.email;
      const adminPassword = prompt("Digite sua senha para confirmar a criação do usuário:");

      if (!adminPassword) {
        setError("Senha do admin não fornecida.");
        return;
      }

      // Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ Usuário criado com sucesso:", user.uid);

      // Salva os dados do usuário no Firestore
      const userRef = doc(db, "usuarios ", user.uid);
      await setDoc(userRef, {
        nome: nome,
        email: email,
        role: role, // Salva o role selecionado
      });

      // Restaura a sessão do admin
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);

      setSuccess("Usuário criado com sucesso!");
      setNome("");
      setPassword("");
      setRole("monitor"); // Reseta o formulário
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      if (error.code === "auth/network-request-failed") {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        setError("Erro ao criar usuário. Verifique os dados e tente novamente.");
      }
    }
  };

  // Função para excluir um usuário do Firestore
  const handleDeleteUser = async (userId) => {
    try {
      // Exclui o usuário do Firestore
      await deleteDoc(doc(db, "usuarios ", userId));
      console.log("Usuário excluído do Firestore:", userId);

      setSuccess("Usuário excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      setError("Erro ao excluir usuário.");
    }
  };

  // Função para editar um usuário
  const handleEditUser = async (userId, newRole) => {
    try {
      const userRef = doc(db, "usuarios ", userId);
      await updateDoc(userRef, { role: newRole });
      console.log("Usuário atualizado com sucesso:", userId);
      setSuccess("Usuário atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setError("Erro ao atualizar usuário.");
    }
  };

  if (loading) {
    return <p>Carregando...</p>; // Exibe um indicador de carregamento
  }

  if (!isAdmin) {
    return (
      <div>
        <p>Acesso negado. Você não tem permissão para acessar esta página.</p>
        <button onClick={handleLogout}>Sair</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Painel de Administração</h1>
      <p>Bem-vindo ao painel de administração!</p>

      {/* Formulário de criação de usuário */}
      <form onSubmit={handleCreateUser}>
        <h2>Criar Novo Usuário</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <div>
          <label>Nome:</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Papel (Role):</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="professor">Professor</option>
            <option value="monitor">Monitor</option>
          </select>
        </div>

        <button type="submit">Criar Usuário</button>
      </form>

      {/* Lista de usuários */}
      <h2>Usuários Cadastrados</h2>
      <ul>
        {usuarios.map((usuario) => (
          <li key={usuario.id}>
            <p>
              <strong>Nome:</strong> {usuario.nome} | <strong>E-mail:</strong> {usuario.email} |{" "}
              <strong>Papel:</strong> {usuario.role}
            </p>
            <button onClick={() => handleEditUser(usuario.id, "admin")}>Tornar Admin</button>
            <button onClick={() => handleEditUser(usuario.id, "professor")}>Tornar Professor</button>
            <button onClick={() => handleEditUser(usuario.id, "monitor")}>Tornar Monitor</button>
            <button onClick={() => handleDeleteUser(usuario.id)}>Excluir</button>
          </li>
        ))}
      </ul>

      {/* Botão de logout */}
      <button onClick={handleLogout}>Sair</button>
    </div>
  );
}

export default AdminDashboard;