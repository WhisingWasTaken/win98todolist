import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         onAuthStateChanged }
         from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc }
         from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "f",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("todo-section").style.display = "block";
    fetchTodos();
  } else {
    document.getElementById("login-section").style.display = "block";
    document.getElementById("todo-section").style.display = "none";
  }
});

window.showEmailLogin = () => {
  document.getElementById("email-login").style.display = "block";
};

window.loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    showError(err.message);
  }
};

window.loginWithEmail = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showError("Incorrect email or password");
  }
};

window.signupWithEmail = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    showError(err.message);
  }
};

function showError(message) {
  document.getElementById("login-error").textContent = message;
  const sound = document.getElementById("error-sound");
  sound.currentTime = 0;
  sound.play();
}

window.addTodo = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  const q = query(collection(db, "todos"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  if (snapshot.size >= 4) {
    const sound = document.getElementById("error-sound");
    sound.currentTime = 0;
    sound.play();

    const errorDiv = document.getElementById("max-limit");
    errorDiv.textContent = "You can only add max 4 todos at a time.";

    setTimeout(() => {
      errorDiv.textContent = "";
    }, 5000);

    return;
  }

  const heading = document.getElementById("new-heading").value;
  const description = document.getElementById("new-description").value;
  const color = document.getElementById("new-color").value;

  await addDoc(collection(db, "todos"), {
    uid: user.uid,
    heading,
    description,
    color,
    done: false,
    createdAt: new Date()
  });

  fetchTodos();
};

async function fetchTodos() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "todos"), where("uid", "==", user.uid));
  const snapshot = await getDocs(q);
  const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTodos(todos);
}

function renderTodos(todos) {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";
  todos.forEach(todo => {
    const item = document.createElement("div");
    item.className = "todo-item";
    item.style.borderColor = todo.color || "#000";

    let timeString = "";
    if (todo.createdAt) {
      const created = todo.createdAt.toDate ? todo.createdAt.toDate() : new Date(todo.createdAt);
      timeString = created.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    item.innerHTML = `
      <div class="todo-heading">${todo.heading}</div>
      <div class="todo-description">${todo.description}</div>
      <div class="todo-time">Added at: ${timeString}</div>
      <div class="todo-actions">
        <button onclick="markDone('${todo.id}', this)">✔</button>
        <button onclick="deleteTodo('${todo.id}')">✖</button>
      </div>
    `;
    list.appendChild(item);
  });
}

window.markDone = async (id, btn) => {
  const item = btn.closest(".todo-item");
  item.classList.add("slide-out");
  setTimeout(async () => {
    await deleteDoc(doc(db, "todos", id));
    fetchTodos();
  }, 500);
};

window.deleteTodo = async (id) => {
  await deleteDoc(doc(db, "todos", id));
  fetchTodos();
};

setInterval(() => {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}, 1000);

document.getElementById("start-btn").addEventListener("click", () => {
  const menu = document.getElementById("start-menu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
});

window.logout = async () => {
  await auth.signOut();
};

