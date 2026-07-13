"use client";

import { useRouter } from "next/navigation";
import { useNotification } from "./NotificationContext";

export default function LogoutButton() {
  const router = useRouter();
  const { notify } = useNotification();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    notify("Logout successful", "success");
    router.push("/login");
  };

  return (
    <button type="button" onClick={logout} className="btn btn-danger shrink-0">
      Logout
    </button>
  );
}
