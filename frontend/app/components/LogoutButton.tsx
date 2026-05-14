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
    <button
      onClick={logout}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
}