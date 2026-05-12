import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">AI Chat App</h1>

      <Link href="/login" className="text-blue-500">
        Go to Login
      </Link>

      <Link href="/chat" className="text-green-500">
        Go to Chat
      </Link>
    </div>
  );
}