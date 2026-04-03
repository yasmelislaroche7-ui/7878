import { useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import { toast } from "../context/ToastContext.jsx";
import { useTxConfirm } from "../context/TxConfirmContext.jsx";

function isUserRejection(err) {
  if (!err) return false;
  if (err.code === 4001) return true;
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("rejected by user") ||
    msg.includes("declined")
  );
}

function toHex(value) {
  if (value === undefined || value === null) return "0x0";
  const bn = BigInt(value.toString());
  if (bn === 0n) return "0x0";
  return `0x${bn.toString(16)}`;
}

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
        throw new Error("user_cancelled");
      }
    }

    setIsPending(true);
    setIsSuccess(false);
    setError(null);
    setData(undefined);

    let hash;
    try {
      const callData = encodeFunctionData({ abi, functionName, args });
      const from = walletClient.account?.address;

      const txParams = {
        from,
        to: address,
        data: callData,
        value: toHex(value),
      };

      hash = await walletClient.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      setData(hash);
      toast("Transacción enviada. Esperando confirmación...", "info", 6000);
    } catch (err) {
      setIsPending(false);
      setError(err);

      if (isUserRejection(err)) {
        toast("Transacción rechazada en World App.", "warning", 5000);
      } else {
        const raw = err?.shortMessage || err?.message || "Error al enviar.";
        toast(`Error: ${raw}`, "error", 8000);
      }
      throw err;
    }

    if (publicClient && hash) {
      setIsConfirming(true);
      try {
        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 120_000,
          pollingInterval: 2_000,
        });
        setIsSuccess(true);
        toast("¡Transacción confirmada exitosamente!", "success", 5000);
      } catch {
        setIsSuccess(true);
        toast(
          `Enviada. Verifica en Worldscan: https://worldscan.org/tx/${hash}`,
          "warning",
          12000,
        );
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
