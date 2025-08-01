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
    const [value, setValue] = useState(null);
    const [loadingPay, setLoadingPay] = useState(false);

    const [redirect_uri, setRedirect_Uri] = useState('');
    const [redirect_failed, setRedirect_Failed] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        const itemsIdString = urlParams.get('itemsId');
        setRedirect_Uri(urlParams.get('redirect_uri'));
        setRedirect_Failed(urlParams.get('redirect_failed'));

        setToken(tokenParam);

        if (!itemsIdString) {
            window.location.href = redirect_failed;
            return;
        }

        try {
            const parsedIds = JSON.parse(itemsIdString);
            if (!Array.isArray(parsedIds) || parsedIds.length === 0) {
                window.location.href = redirect_failed;
                return;
            }
            setItemIds(parsedIds);
        } catch (e) {
            console.error('Invalid itemsId format', e);
            window.location.href = redirect_failed;
        }
    }, []);

    // Fetch products
    useEffect(() => {
        if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
            fetch('https://bot.kediritechnopark.com/webhook/store-dev/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemsId: itemIds, noParents: true }),
            })
                .then((res) => res.json())
                .then((data) => {
                    setProducts(data);
                })
                .catch((err) => {
                    console.error('Error fetching products:', err);
                });
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
            const params = new URLSearchParams();
            itemIds.forEach((id) => params.append('itemsId', id));
            params.append('socketId', socketId);
            // Jika butuh socketId bisa tambahkan di sini, misal: params.append('socketId', socketId);

            const response = await fetch('https://bot.kediritechnopark.com/webhook/store-dev/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${token}`,
                },
                body: params.toString(),
            });

            const result = await response.json();

            if (response.ok && result?.qris_dynamic) {
                setQrisData(result.qris_dynamic);
                setValue(result.total_price);
            } else {
                alert(`Gagal mendapatkan QRIS: ${result?.error || 'Unknown error'}`);
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
            }, 10000); // 10 detik = 10000 ms

            // Bersihkan timer kalau komponen unmount atau transactionSuccess berubah
            return () => clearTimeout(timer);
        }
    }, [transactionSuccess]);


    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                boxSizing: 'border-box',
            }}
        >
            <div className={styles.checkoutCard}>
                {/* Product List */}
                <div className={styles.cartSection}>
                    {!qrisData &&
                        <>
                            <h2 className={styles.cartTitle}>Your Cart</h2>
                            <ul className={styles.cartList}>
                                {products.map((item, index) => (
                                    <li key={index} className={styles.cartItem}>
                                        <div className={styles.itemDetails}>
                                            <img
                                                src={item.image || 'https://via.placeholder.com/60'}
                                                alt={item.name}
                                                className={styles.productImage}
                                            />
                                            <div>
                                                <p className={styles.itemText}>{item.name}</p>
                                                <p className={styles.itemPrice}>Rp{item.price?.toLocaleString('id-ID')}</p>
                                                {item.duration?.hours && (
                                                    <p style={{ fontSize: '0.8rem', color: '#777' }}>
                                                        Durasi: {item.duration.hours} jam
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => handleRemove(item.id)}
                                            aria-label={`Remove ${item.name}`}
                                        >
                                            &times;
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    }

                    {qrisData && (
                        <>
                            <p>Silahkan scan QRIS ini</p>

                            <div style={{ marginTop: '2rem', textAlign: 'center', position: 'relative', display: 'inline-block' }}>
                                <QRCodeCanvas value={qrisData} size={256} />

                                {transactionSuccess && (
                                    <div className={styles.CheckmarkOverlay}>
                                        <svg
                                            className={styles.Checkmark}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 52 52"
                                        >
                                            <circle
                                                className={styles.CheckmarkCircle}
                                                cx="26"
                                                cy="26"
                                                r="25"
                                                fill="none"
                                                stroke="#4BB543"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className={styles.CheckmarkCheck}
                                                fill="none"
                                                stroke="#4BB543"
                                                strokeWidth="4"
                                                d="M14 27l7 7 16-16"
                                            />
                                        </svg>
                                    </div>
                                )}

                                {!transactionSuccess && (
                                    <>
                                        <h2>Rp{value?.toLocaleString('id-ID')}</h2>
                                    </>
                                )}
                            </div>
                        </>
                    )}


                </div>

                {/* Checkout form */}
                <div className={styles.checkoutSection}>
                    <div>
                        <h2 className={styles.checkoutTitle}>
                            Rp{qrisData ? value : products.reduce((acc, item) => acc + (item.price || 0), 0).toLocaleString('id-ID')}
                        </h2>
                        <div style={{ marginBottom: '1.5rem' }}>
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
                            disabled={loadingPay || qrisData !== null}
                        >
                            {loadingPay ? 'Processing...' : qrisData ? 'Payment QRIS Generated' : 'Complete Payment'}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className={styles.footerText}>
                        Powered by <span className={styles.footerHighlight}>KEDIRITECHNOPARK</span> •{' '}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
