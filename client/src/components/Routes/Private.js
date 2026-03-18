import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

export default function PrivateRoute() {
  const [ok, setOk] = useState(false);
  const [auth, setAuth] = useAuth();

  // Sun Zihan, A0259581R
  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/user-auth");
        if (res.data.ok) {
          setOk(true);
        } else {
          setOk(false);
          setAuth({ ...auth, user: null, token: "" });
          localStorage.removeItem("auth");
        }
      } catch (error) {
        setOk(false);
        setAuth({ ...auth, user: null, token: "" });
        localStorage.removeItem("auth");
      }
    };
    if (auth?.token) authCheck();
  }, [auth?.token, setAuth, auth]); 

  return ok ? <Outlet /> : <Spinner path="" />;
}