import { useState } from "react";
import axios from "axios";

const API =
  import.meta.env.VITE_API_URL;

function Auth() {
  const [isLogin, setIsLogin] =
    useState(true);

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res =
          await axios.post(
            `${API}/auth/login`,
            {
              email:
                formData.email,
              password:
                formData.password,
            }
          );

        localStorage.setItem(
          "token",
          res.data.token
        );

        alert(
          "Login Successful"
        );
      } else {
        await axios.post(
          `${API}/auth/register`,
          formData
        );

        alert(
          "Registration Successful"
        );

        setIsLogin(true);
      }
    } catch (err) {
      alert(
        err.response?.data
          ?.message ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="auth-container">
      <form
        onSubmit={handleSubmit}
      >
        <h2>
          {isLogin
            ? "Login"
            : "Register"}
        </h2>

        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={
              handleChange
            }
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={
            handleChange
          }
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={
            handleChange
          }
        />

        <button type="submit">
          {isLogin
            ? "Login"
            : "Register"}
        </button>

        <p>
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <span
            style={{
              color: "blue",
              cursor:
                "pointer",
              marginLeft:
                "5px",
            }}
            onClick={() =>
              setIsLogin(
                !isLogin
              )
            }
          >
            {isLogin
              ? "Register"
              : "Login"}
          </span>
        </p>
      </form>
    </div>
  );
}

export default Auth;