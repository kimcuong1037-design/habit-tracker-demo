import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext.js";
import { ApiError } from "@/api/client.js";
import { Button } from "@/components/ui/button.js";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.js";

type AuthMode = "login" | "register";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
}

export default function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthDialogProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset when mode changes
  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError("");
  }

  // Reset when dialog opens/closes
  function handleOpenChange(open: boolean) {
    if (!open) {
      setUsername("");
      setPassword("");
      setError("");
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await register(username, password);
        toast.success("注册成功，欢迎！");
      } else {
        await login(username, password);
        toast.success("登录成功");
      }
      handleOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("网络错误，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>🌱</span>
            {isRegister ? "创建账号" : "欢迎回来"}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? "创建你的账号，开始科学养成好习惯"
              : "登录你的账号，继续习惯之旅"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              用户名{isRegister && " *"}
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRegister ? "3-20 字符，字母/数字/下划线" : "请输入用户名"}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              密码{isRegister && " *"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "至少 6 个字符" : "请输入密码"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
            {isRegister && (
              <p className="text-xs text-stone-500">至少 6 个字符</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading
              ? "处理中..."
              : isRegister
                ? "注册"
                : "登录"}
          </Button>

          {!isRegister && (
            <p className="text-center text-xs text-stone-500">
              💡 体验账号：demo / demo1234
            </p>
          )}

          <p className="text-center text-sm text-stone-600">
            {isRegister ? (
              <>
                已有账号？{" "}
                <button
                  type="button"
                  className="text-emerald-600 underline-offset-2 hover:underline"
                  onClick={() => switchMode("login")}
                >
                  登录
                </button>
              </>
            ) : (
              <>
                还没有账号？{" "}
                <button
                  type="button"
                  className="text-emerald-600 underline-offset-2 hover:underline"
                  onClick={() => switchMode("register")}
                >
                  注册
                </button>
              </>
            )}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
