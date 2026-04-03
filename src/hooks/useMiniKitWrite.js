import { useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { toast } from "../context/ToastContext.jsx";
import { useTxConfirm } from "../context/TxConfirmContext.jsx";

export function useMiniKitWrite() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { confirmTx } = useTxConfirm();

  const [data, setData] = useState(undefined);
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const writeContractAsync = useCallback(async ({
    address,
    abi,
    functionName,
    args = [],
    value,
    txMeta,
  }) => {
    if (!walletClient) {
      const msg = "Conecta tu wallet de World App primero.";
      toast(msg, "warning", 4000);
      throw new Error(msg);
    }

    if (txMeta) {
      const confirmed = await confirmTx(txMeta);
      if (!confirmed) {
        toast("Transacción cancelada.", "info", 3000);
        throw new Error("user_cancelled");
      }
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setData(undefined);

    let hash;
    try {
      hash = await walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
        ...(value !== undefined ? { value } : {}),
      });

      setData(hash);
      toast("Transacción enviada. Esperando confirmación...", "info", 5000);
    } catch (err) {
      setIsPending(false);
      const isCancel =
        err?.message?.toLowerCase().includes("user rejected") ||
        err?.message?.toLowerCase().includes("user denied") ||
        err?.message?.toLowerCase().includes("cancelled") ||
        err?.code === 4001;

      const msg = isCancel
        ? "Transacción rechazada por el usuario."
        : err?.shortMessage || err?.message || "Error al enviar la transacción.";

      setError(err);
      toast(msg, isCancel ? "warning" : "error", 5000);
      throw err;
    }

    if (publicClient && hash) {
      setIsConfirming(true);
      try {
        await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
        setIsSuccess(true);
        toast("¡Transacción confirmada!", "success", 4000);
      } catch (waitErr) {
        toast("Transacción enviada pero no se pudo confirmar. Verifica en Worldscan.", "warning", 6000);
      } finally {
        setIsConfirming(false);
        setIsPending(false);
      }
    } else {
      setIsPending(false);
    }

    return hash;
  }, [walletClient, publicClient, confirmTx]);

  return { writeContractAsync, data, isPending, isConfirming, isSuccess, error };
}
