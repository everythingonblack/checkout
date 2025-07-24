// src/App.js
import { useEffect, useState } from 'react';
import './App.css';
import Checkout from './Checkout';
import socket from './socket';

function App() {
  const [socketId, setSocketId] = useState(null);
  const [transactionSuccess, setTransactionSuccess] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected with socket ID:', socket.id);
      setSocketId(socket.id);
    });

    socket.on('transactionSuccess', (data) => {
      console.log('Transaction success:', data);
      setTransactionSuccess(data); // data bisa berisi transactionId, status, dll
    });

    return () => {
      socket.off('connect');
      socket.off('transactionSuccess');
    };
  }, []);

  return (
    <div className="App">
      <main>
        <Checkout socketId={socketId} transactionSuccess={transactionSuccess} />
      </main>
    </div>
  );
}

export default App;
