"use client";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <h1 className="text-lg font-semibold">Client Area</h1>
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Hi, Alfath</span>
        <img
          src="/avatar.png"
          alt="Profile"
          className="w-8 h-8 rounded-full border"
        />
      </div>
    </header>
  );
}
