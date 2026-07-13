"use client";

type Props = {
  username: string;
};

export default function UserProfile({ username }: Props) {
  const initial = username.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 pb-5 border-b border-[#d5e6e3]">
      <div
        className="w-11 h-11 rounded-full bg-gradient-to-br from-[#14b8a6] to-[#0e7490] text-white flex items-center justify-center font-semibold text-sm tracking-wide shadow-md shadow-teal-900/15"
        aria-hidden
      >
        {initial}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0f9f8a]">Admin</p>
        <p className="font-semibold text-[#0b1c24] truncate">{username}</p>
      </div>
    </div>
  );
}
