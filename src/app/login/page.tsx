'use client'
import { supabase } from "@/lib/supabase"
import { useState } from "react"


export default function LoginPage() {
  const [email, setEmail] = useState("")

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else alert("Magic link dikirim!")
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input type="email" placeholder="Email"
        className="border p-2 w-full mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleLogin} className="bg-black text-white p-2 w-full">
        Kirim Magic Link
      </button>
    </div>
  )
}