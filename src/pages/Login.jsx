import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebaseconfig";
import { FcGoogle } from "react-icons/fc";
import { useGlobal } from "../App";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

import { db } from "../firebase/firebaseconfig";
function Login() {
  const { users } = useGlobal(); // use global users from App.js
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ---------------------------
  // 🔥 Google Sign-in
  // ---------------------------


const addUserToFirestore = async (user) => {
  try {
    // 1️⃣ Check if user already exists
    const usersRef = collection(db, "Users");
    const q = query(usersRef, where("User", "==", user.User));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("User already exists:", user.User);
      return; // Stop here, don't add duplicate
    }

    // 2️⃣ Add user if not exists
    await addDoc(usersRef, {
      Admin: user.Admin,
      Method: user.Method,
      Name: user.Name,
      Pasword: null,
      User: user.User
    });

    console.log("Uploaded successfully");

  } catch (e) {
    console.error("Error uploading user:", e);
  }
};

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);

 const user = {
Admin : false , Method : "Google" , Name : result.user.displayName , Pasword : null , User:result.user.email
 }
 addUserToFirestore(user)

      // Save Google user locally
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate("/"); // redirect after login
    } catch (error) {
      console.log(error);
      setError("Google login failed.");
    }
  };

  // ---------------------------
  // 🔥 Email + Password Login
  // ---------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!users || users.length === 0) {
      setError("No users available. Try again later.");
      return;
    }

    const user = users.find(
      (u) => u.User === email && u.Pasword === password
    );

    if (!user) {
      setError("Invalid email or password.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));

    if (user.Admin === true) {
      navigate("/Dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div
        className="p-5 rounded shadow-lg bg-white"
        style={{ width: "400px", maxWidth: "90%" }}
      >
        <h3 className="text-center mb-4 fw-semibold">Login</h3>

        <button
          onClick={loginWithGoogle}
          className="mb-3 py-2 signinwithgoogle rounded-pill w-100 d-flex align-items-center justify-content-center gap-2 border"
        >
          <FcGoogle size={24} /> <span>Log in with Google</span>
        </button>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              placeholder="Email"
              className="form-control p-3 border border-dark rounded"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              placeholder="Password"
              className="form-control p-3 border border-dark rounded"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>

          {error && <p className="text-danger small mb-2">{error}</p>}

          <div className="mb-2 text-start">
            <a href="#" className="small text-decoration-none">
              Forgot your password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 rounded-pill fw-semibold"
          >
            Login
          </button>

          <button className="text-center mt-3 w-100 border-0 py-2 rounded-5 bg-white">
            <a href="#" className="text-decoration-none">Sign up</a>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
