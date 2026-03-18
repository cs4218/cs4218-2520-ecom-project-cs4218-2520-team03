import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { Outlet, Navigate } from "react-router-dom";
import axios from "axios";
import Spinner from "../Spinner";

export default function AdminRoute() {
  const [ok, setOk] = useState(null);
  const [auth, , loading] = useAuth();

  useEffect(() => {
    const authCheck = async () => {
      try {
        const res = await axios.get("/api/v1/auth/admin-auth", {
          headers: {
            Authorization: auth.token,
          },
        });
        setOk(res.data.ok);
      } catch (error) {
        console.log("admin-auth error:", error.response?.data || error.message);
        setOk(false);
      }
    };

    if (loading) return;

    if (auth?.token) {
      authCheck();
    } else {
      setOk(false);
    }
  }, [auth?.token, loading]);

  if (loading || ok === null) return <Spinner />;

  return ok ? <Outlet /> : <Navigate to="/login" replace />;
}