import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence  } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBddMOXPd-gPVmwjXaGiMMm42uwK4flsdU",
    authDomain: "monitoramento-de-aulas.firebaseapp.com",
    projectId: "monitoramento-de-aulas",
    storageBucket: "monitoramento-de-aulas.firebasestorage.app",
    messagingSenderId: "261386181525",
    appId: "1:261386181525:web:9d71f2b3c4074bcf99f49c"
  };

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o Firestore (Banco de Dados)
export const db = getFirestore(app);

// Exporta a autenticação para ser usada em outros arquivos
const auth = getAuth(app);

export { auth };

// Define a persistência da autenticação para manter o login salvo
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada"))
  .catch((error) => console.error("Erro na persistência:", error));