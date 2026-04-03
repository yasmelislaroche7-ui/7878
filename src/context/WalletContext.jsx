import { createContext, useContext, useState, useCallback } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { worldApp } from "@worldcoin/minikit-js/wagmi";
import { useConnect, useDisconnect, useAccount } from "wagmi";
import { toast } from "./ToastContext.jsx";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();

  const connect = useCallback(async () => {
    const inWorldApp = (() => {
      try { return MiniKit.isInstalled(); } catch { return false; }
    })();

    if (!inWorldApp) {
      toast("Esta app solo funciona dentro de World App.", "warning", 5000);
      setError("Abre esta app dentro de World App.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    toast("Conectando con World App...", "info", 8000);

    try {
      await connectAsync({ connector: worldApp("World App") });
      toast("Wallet conectada correctamente.", "success", 3000);
      setError(null);
    } catch (err) {
      const isCancel =
        err?.message?.toLowerCase().includes("user rejected") ||
        err?.message?.toLowerCase().includes("user denied") ||
        err?.message?.toLowerCase().includes("cancelled");

      const msg = isCancel
        ? "Conexión cancelada por el usuario."
        : "Error al conectar. Asegúrate de tener World App actualizado.";

      setError(msg);
      toast(msg, isCancel ? "warning" : "error", 5000);
    } finally {
      setIsConnecting(false);
    }
  }, [connectAsync]);

  const disconnect = useCallback(async () => {
    setError(null);
    try { await disconnectAsync(); } catch {}
    toast("Wallet desconectada.", "info", 3000);
  }, [disconnectAsync]);

  return (
    <WalletContext.Provider value={{ address, isConnected, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
