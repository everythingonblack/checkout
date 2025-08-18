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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const itemsIdString = urlParams.get('itemsId');
    setRedirect_Uri(urlParams.get('redirect_uri') || '');
    setRedirect_Failed(urlParams.get('redirect_failed') || '');
    setToken(tokenParam);

    if (!itemsIdString) {
      window.location.href = urlParams.get('redirect_failed') || '/';
      return;
    }

    try {
      const parsedIds = JSON.parse(itemsIdString);
      if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
        window.location.href = urlParams.get('redirect_failed') || '/';
        return;
      }
      setItemIds(parsedIds);
    } catch (e) {
      console.error('Invalid itemsId format', e);
      window.location.href = urlParams.get('redirect_failed') || '/';
    }
  }, []);

  // Fetch products
  useEffect(() => {
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
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

  const handleRemove = (id) => {
    const updatedItemIds = itemIds.filter((itemId) => itemId !== id);
    const updatedProducts = products.filter((product) => product.id !== id);

    if (updatedItemIds.length === 0) {
      window.location.href = redirect_failed;
      return;
    }

    setItemIds(updatedItemIds);
    setProducts(updatedProducts);

    const url = new URL(window.location);
    url.searchParams.set('itemsId', JSON.stringify(updatedItemIds));
    window.history.replaceState(null, '', url.toString());
  };

  const handlePay = async () => {
    if (!itemIds || !token) {
      alert('Token atau itemsId tidak ditemukan.');
      return;
    }

    setLoadingPay(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const newName = urlParams.get('new_name');
      const setName = urlParams.get('set_name');

      const params = new URLSearchParams();
      itemIds.forEach((id) => params.append('itemsId', id));
      params.append('socketId', socketId);
      params.append('paymentMethod', paymentMethod);
      if (newName) params.append('newName', newName);
      if (setName) params.append('setName', setName);

      const response = await fetch('https://bot.kediritechnopark.com/webhook/store-production/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
        body: params.toString(),
      });

      const result = await response.json();
      if (response.ok) {
        if (paymentMethod === 'QRIS' && result?.qris_dynamic) {
          setQrisData(result.qris_dynamic);
          setValue(result.total_price);
        } else if (paymentMethod === 'Bank Transfer' && result?.bank_account) {
          setTransferData(result);
          setValue(result.total_price);
        } else {
          alert(`Gagal memproses pembayaran: ${result?.error || 'Unknown error'}`);
        }
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

  useEffect(() => {
    if (transactionSuccess) {
      const timer = setTimeout(() => {
        window.location.href = redirect_uri;
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [transactionSuccess, redirect_uri]);

  const subtotal = products.reduce((acc, item) => acc + (item.price || 0), 0);
  const shipping = 0;
  const tax = 0;
  const grandTotal = subtotal + shipping + tax;

  return (
    <div className={styles.page}>
      <div className={styles.checkoutCard}>
        <div className={styles.cartSection}>
          {!qrisData && !transferData ? (
            <>
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
                    <th>Quantity</th>
                    <th className={styles.textRight}>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.qty ?? 1}</td>
                      <td className={styles.textRight}>
                        Rp{(item.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className={styles.textRight}>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleRemove(item.id)}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.summary}>  
                <div className={styles.summaryRow}>
                  <span>SUBTOTAL</span>
                  <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>SHIPPING</span>
                  <span>Rp{shipping.toLocaleString('id-ID')}</span>
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
            </>
          ) : paymentMethod === 'QRIS' ? (
            <>
              <p className={styles.qrTitle}>Silakan scan QRIS ini</p>
              <div className={styles.qrBox}>
                <QRCodeCanvas value={qrisData} size={256} />
                {transactionSuccess && (
                  <div className={styles.CheckmarkOverlay}>
                    <svg className={styles.Checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                      <circle className={styles.CheckmarkCircle} cx="26" cy="26" r="25" />
                      <path className={styles.CheckmarkCheck} d="M14 27l7 7 16-16" />
                    </svg>
                  </div>
                )}
                {!transactionSuccess && <h2>Rp{value?.toLocaleString('id-ID')}</h2>}
              </div>
            </>
          ) : (
            <div className={styles.transferBox}>
              <h3 className={styles.transferTitle}>Bank Transfer Information</h3>
              <div className={styles.transferRow}><span>Bank</span><span>{transferData?.bank_name}</span></div>
              <div className={styles.transferRow}><span>Account No</span><span>{transferData?.bank_account}</span></div>
              <div className={styles.transferRow}><span>Account Name</span><span>{transferData?.account_name}</span></div>
              <div className={styles.transferRow}><span>Total</span><span>Rp{value?.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>

        <div className={styles.checkoutSection}>
          <div>
            <h2 className={styles.checkoutTitle}>
              Rp{(qrisData || transferData ? value : grandTotal).toLocaleString('id-ID')}
            </h2>

            <div className={styles.paymentInfo}>
              <p className={styles.paymentHeading}>PAYMENT INFORMATION</p>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="payment"
                  value="Bank Transfer"
                  checked={paymentMethod === 'Bank Transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Bank Transfer
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="payment"
                  value="QRIS"
                  checked={paymentMethod === 'QRIS'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                QRIS
              </label>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder={parseJwt(token)?.username || 'User'}
                className={styles.inputNote}
                readOnly
              />
            </div>

            <button
              className={styles.paymentBtn}
              onClick={handlePay}
              disabled={loadingPay || qrisData !== null || transferData !== null}
            >
              {loadingPay ? 'Processing...' : (qrisData || transferData) ? 'Payment Created' : 'PAY'}
            </button>
          </div>

          <div className={styles.footerText}>
            Powered by <span className={styles.footerHighlight}>KEDIRITECHNOPARK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
