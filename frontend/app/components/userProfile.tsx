"use client";

type Props = {
  username: string;
};

export default function UserProfile({ username }: Props) {
  return (
    <div className="flex items-center gap-3">
      
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
        {username.charAt(0).toUpperCase()}
      </div>

      {/* Username */}
      <p className="font-medium text-black">
        {username}
      </p>
    </div>
  );
}