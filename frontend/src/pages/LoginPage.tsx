import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "/api/auth";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const reg = await fetch(`${AUTH_URL}/register`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (reg.status === 409) { setError("Email already registered"); setLoading(false); return; }
        if (!reg.ok) { setError("Registration failed"); setLoading(false); return; }
        toast.success("Account created — log in");
        setMode("login");
        setLoading(false);
        return;
      }

      const res = await fetch(`${AUTH_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) { setError("Invalid email or password"); setLoading(false); return; }
      if (!res.ok) { setError("Login failed"); setLoading(false); return; }
      const data = await res.json();
      localStorage.setItem("torque_token", data.accessToken);
      onLogin(data.accessToken);
    } catch {
      setError("Connection error — is the server running?");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
      <Card className="w-[380px] bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-torque-400 to-torque-600 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">T</div>
          <CardTitle className="text-gray-100 text-lg">Torque</CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-400 text-xs">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="bg-gray-800 border-gray-700 text-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-400 text-xs">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} required minLength={8} className="bg-gray-800 border-gray-700 text-gray-200" />
            </div>
            {error && <div className="text-xs text-red-400 text-center">{error}</div>}
            <Button type="submit" disabled={loading || !email || !password} className="w-full">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
