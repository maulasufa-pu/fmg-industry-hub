"use client";

import Image from "next/image";

interface HeaderProps {
  userName?: string;
  avatarSrc?: string;
}

export default function Header({
  userName = "Alfath",
  avatarSrc = "/avatar.png",
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <h1 className="text-lg font-semibold">Client Area</h1>
      <nav aria-label="User menu" className="flex items-center gap-4">
        <span className="text-gray-600">Hi, {userName}</span>
        <Image
          src={avatarSrc}
          alt={`${userName} profile picture`}
          width={32}
          height={32}
          className="rounded-full border"
          priority
        />
        {/* Contoh tombol logout, bisa dikembangkan */}
        <button
          type="button"
          aria-label="Logout"
          className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          onClick={() => {
            // fungsi logout nanti di sini
            alert("Logout clicked");
          }}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
