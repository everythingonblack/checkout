import React, { useEffect, useState } from 'react';
import styles from './Checkout.module.css';
import { QRCodeCanvas } from 'qrcode.react';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function formatTimeLeft(ms) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

const Checkout = ({ socketId, transactionSuccess }) => {
  const [products, setProducts] = useState([]);
  const [itemIds, setItemIds] = useState(null);
  const [token, setToken] = useState(null);

  const [qrisData, setQrisData] = useState(null);
  const [transferData, setTransferData] = useState(null);
  const [value, setValue] = useState(null);
  const [loadingPay, setLoadingPay] = useState(false);

  const [redirect_uri, setRedirect_Uri] = useState('');
  const [redirect_failed, setRedirect_Failed] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');

  const [payTimeout, setPayTimeout] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const [activeAccordion, setActiveAccordion] = useState('QRIS');

  let grandTotal = 0;
  let tax = 0;

  useEffect(() => {
    if (!socketId) return;

    let urlParams = new URLSearchParams(window.location.search);
    let tokenParam = urlParams.get('token');
    let itemsIdString = urlParams.get('itemsId');

    const handlePay = async () => {
      setLoadingPay(true);

      try {
        const newName = urlParams.get('new_name');
        const setName = urlParams.get('set_name');

        const params = new URLSearchParams();
        itemsIdString.forEach((id) => params.append('itemsId', id));
        params.append('socketId', socketId);
        params.append('paymentMethod', paymentMethod);
        if (newName) params.append('newName', newName);
        if (setName) params.append('setName', setName);

        const response = await fetch('https://bot.kediritechnopark.com/webhook/store-production/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${tokenParam}`,
          },
          body: params.toString(),
        });

        const result = await response.json();
        if (response.ok) {
          setValue(result.total_price);
          if (result.pay_timeout && result.time_now) {
            const timeout = new Date(result.pay_timeout).getTime();
            const now = new Date(result.time_now).getTime();
            setPayTimeout(timeout);
            setTimeLeft(timeout - now);
          }

          setQrisData(result.qris_dynamic || null);
          setTransferData(result);

          grandTotal = result.total_price;
          tax = 0;

        } else {
          alert(`Request gagal: ${result?.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Network error:', error);
        alert('Terjadi kesalahan jaringan.');
      } finally {
        setLoadingPay(false);
      }
    };

    itemsIdString = JSON.parse(urlParams.get('itemsId'));
    setRedirect_Uri(urlParams.get('redirect_uri') || '');
    setRedirect_Failed(urlParams.get('redirect_failed') || '');
    setToken(tokenParam);

    if (!itemsIdString || !Array.isArray(itemsIdString) || itemsIdString.length === 0) {
      window.location.href = urlParams.get('redirect_failed') || '/';
      return;
    }

    setItemIds(itemsIdString);
    handlePay();
  }, [socketId]);

  useEffect(() => {
    if (itemIds?.length > 0) {
      fetch('https://bot.kediritechnopark.com/webhook/store-production/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemsId: itemIds, noParents: true }),
      })
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch((err) => console.error('Error fetching products:', err));
    }
  }, [itemIds]);

  useEffect(() => {
    if (transactionSuccess) {
      const timer = setTimeout(() => {
        window.location.href = redirect_uri;
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [transactionSuccess, redirect_uri]);

  useEffect(() => {
    if (!payTimeout) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = payTimeout - now;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        alert('Waktu pembayaran habis.');
        window.location.href = redirect_failed;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [payTimeout]);

  return (
    <div className={styles.page}>
      <div className={styles.checkoutCard}>
        <div className={styles.cartSection}>
          <div className={styles.invHeader}>
            <div>
              <h2 className={styles.brand}>
                KEDIRI<span className={styles.brandLight}>TECHNOPARK</span>
              </h2>
              <p className={styles.greeting}>
                Hello, {parseJwt(token)?.username || 'User'} <br />
                Thank you for your order
              </p>
            </div>
            <div className={styles.orderInfo}>
              <div className={styles.invoiceLabel}>Invoice</div>
              <div className={styles.orderMeta}>ORDER #{String(itemIds?.[0] || '').padStart(5, '0')}</div>
              <div className={styles.orderMeta}>{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th className={styles.textRight}>{grandTotal}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className={styles.textRight}>
                    Rp{(item.price || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>SUBTOTAL</span>
              <span>Rp{grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>TAX</span>
              <span>Rp{tax.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>Rp{grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className={styles.checkoutSection}>
          {(qrisData || transferData) && (
            <div className="mt-4">
              {qrisData && (
                <div className={styles.accordion}>
                  <div
                    className={styles.accordionHeader}
                    onClick={() =>
                      setActiveAccordion(activeAccordion === 'QRIS' ? '' : 'QRIS')
                    }
                  >
                    QRIS Payment
                  </div>
                  {activeAccordion === 'QRIS' && (
                    <div className={styles.accordionBody}>
                      <QRCodeCanvas value={qrisData} size={200} />
                      {!transactionSuccess && (
                        <>
                          <h5 className="mt-3">Rp{value?.toLocaleString('id-ID')}</h5>
                          {timeLeft !== null && (
                            <p>Waktu tersisa: <strong>{formatTimeLeft(timeLeft)}</strong></p>
                          )}
                        </>
                      )}
                      {transactionSuccess && (
                        <div className={styles.CheckmarkOverlay}>
                          <svg className={styles.Checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className={styles.CheckmarkCircle} cx="26" cy="26" r="25" />
                            <path className={styles.CheckmarkCheck} d="M14 27l7 7 16-16" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {transferData && (
                <div className={styles.accordion}>
                  <div
                    className={styles.accordionHeader}
                    onClick={() =>
                      setActiveAccordion(activeAccordion === 'Bank' ? '' : 'Bank')
                    }
                  >
                    Bank Transfer
                  </div>
                  {activeAccordion === 'Bank' && (
                    <div className={styles.accordionBody}>
                      <div><strong>Bank:</strong> {transferData?.bank_name}</div>
                      <div><strong>Account No:</strong> {transferData?.bank_account}</div>
                      <div><strong>Account Name:</strong> {transferData?.account_name}</div>
                      <div><strong>Total:</strong> Rp{value?.toLocaleString('id-ID')}</div>
                      {timeLeft !== null && (
                        <div><strong>Waktu Tersisa:</strong> {formatTimeLeft(timeLeft)}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={styles.footerText}>
            Powered by <span className={styles.footerHighlight}>KEDIRITECHNOPARK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
