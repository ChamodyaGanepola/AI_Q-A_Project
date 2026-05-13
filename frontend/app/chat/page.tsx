"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "../components/ChatBox";

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return <ChatBox />;
}