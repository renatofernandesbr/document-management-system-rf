import { useState } from 'react';

// Executa uma ação assíncrona controlando estado de carregamento e erro.
// Retorna o resultado da ação, ou undefined em caso de falha.
export default function useAsyncAction(action) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(...args) {
    setBusy(true);
    setError('');
    try {
      return await action(...args);
    } catch (actionError) {
      setError(actionError.message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, setError };
}
