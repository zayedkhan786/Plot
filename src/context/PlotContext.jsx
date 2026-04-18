import { createContext, useContext, useEffect, useState } from 'react';
import { subscribePlots, subscribeTransactions } from '../firebase/firestore';

const PlotContext = createContext(null);

export function PlotProvider({ children }) {
  const [plots, setPlots]               = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(null);

  useEffect(() => {
    let firstLoad = true;
    let unsubPlots = () => {};
    let unsubTx   = () => {};

    try {
      unsubPlots = subscribePlots(
        (data) => {
          setPlots(data);
          setDbError(null);
          if (firstLoad) { setLoading(false); firstLoad = false; }
        },
        (err) => {
          // onError callback from snapshot listener
          const msg = err?.message || String(err);
          if (msg.toLowerCase().includes('permission')) {
            setDbError('Missing or insufficient permissions. Go to Setup → Step 3 and publish the Firestore security rules.');
          } else {
            setDbError(msg);
          }
          setLoading(false);
        }
      );
      unsubTx = subscribeTransactions(setTransactions);
    } catch (err) {
      const msg = err?.message || String(err);
      setDbError(msg);
      setLoading(false);
    }

    return () => { unsubPlots(); unsubTx(); };
  }, []);

  const stats = {
    total:        plots.length,
    available:    plots.filter((p) => p.status === 'available').length,
    pending:      plots.filter((p) => p.status === 'pending').length,
    sold:         plots.filter((p) => p.status === 'sold').length,
    totalRevenue: plots.reduce((s, p) => s + (p.amountReceived || 0), 0),
    totalPending: plots.reduce((s, p) => s + (p.amountPending  || 0), 0),
    totalAgreed:  plots
      .filter((p) => p.status !== 'available')
      .reduce((s, p) => s + (p.price || 0), 0),
  };

  return (
    <PlotContext.Provider value={{ plots, transactions, loading, stats, dbError }}>
      {children}
    </PlotContext.Provider>
  );
}

export const usePlots = () => useContext(PlotContext);
