import { useState, useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";
import { parseGwei } from "viem";
import { toast } from "../context/ToastContext.jsx";
import { useTxConfirm } from "../context/TxConfirmContext.jsx";

const DEFAULT_GAS = {
  gas:                  700_000n,
  maxFeePerGas:         parseGwei("0.001"),
  maxPriorityFeePerGas: parseGwei("0.001"),
};

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
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
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

    const gasParams = {
      gas:                  gas                  ?? DEFAULT_GAS.gas,
      maxFeePerGas:         maxFeePerGas         ?? DEFAULT_GAS.maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas ?? DEFAULT_GAS.maxPriorityFeePerGas,
    };

    let hash;
    try {
      hash = await walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
        ...(value !== undefined ? { value } : {}),
        ...gasParams,
      });

      setData(hash);
      toast("Transacción enviada. Esperando confirmación...", "info", 5000);
    } catch (err) {
      setIsPending(false);

      const errMsg = err?.message || "";
      const errLow = errMsg.toLowerCase();

      const isCancel =
        err?.code === 4001 ||
        errLow.includes("user rejected") ||
        errLow.includes("user denied") ||
        errLow.includes("rejected the request") ||
        (errLow.includes("cancelled") && !errLow.includes("hash"));

      const msg = isCancel
        ? "Transacción cancelada por el usuario."
        : err?.shortMessage || errMsg || "Error al enviar la transacción.";

      setError(err);
      toast(msg, isCancel ? "warning" : "error", 5000);
      throw err;
    }

    if (publicClient && hash) {
      setIsConfirming(true);
      try {
        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 90_000,
          pollingInterval: 2_000,
        });
        setIsSuccess(true);
        toast("¡Transacción confirmada!", "success", 4000);
      } catch (waitErr) {
        const txUrl = `https://worldscan.org/tx/${hash}`;
        toast(
          `Transacción enviada. Puedes verificarla en Worldscan: ${txUrl}`,
          "warning",
          10000,
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
