import React, { useState, useEffect } from 'react';
import './Checkout.css';
import { QRCodeCanvas } from 'qrcode.react';

const Checkout = ({ socketId, transactionSuccess }) => {
    const [qrisData, setQrisData] = useState(null); // QRIS string
    const [value, setValue] = useState(null); // QRIS value (optional)
    const [products, setProducts] = useState([]); // Produk dari itemsId
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Helper get cookie value
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    useEffect(() => {

        const fetchProducts = async () => {
            const itemsIdRaw = getCookie('itemsId');
            if (!itemsIdRaw) return;

            let itemsId = [];
            try {
                itemsId = JSON.parse(itemsIdRaw);
            } catch (e) {
                console.error('Gagal parse itemsId dari cookie:', e);
                return;
            }

            if (itemsId.length === 0) return;

            setLoadingProducts(true);

            try {
                const token = getCookie('token');
                if (!token) {
                    console.warn('Token tidak ditemukan');
                    return;
                }

                const params = new URLSearchParams();
                itemsId.forEach(id => params.append('itemsId', id));

                const res = await fetch(`https://bot.kediritechnopark.com/webhook/store-dev/products`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString(),
                });

                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, []);


    const handlePay = async (e) => {
        e.preventDefault();

        let itemsIdRaw = getCookie('itemsId');
        let token = getCookie('token');

        if (!itemsIdRaw || !token) {
            alert("Token atau itemsId tidak ditemukan di cookies.");
            return;
        }

        let itemsId = [];
        try {
            itemsId = JSON.parse(itemsIdRaw);
        } catch (e) {
            alert("Gagal parsing itemsId.");
            return;
        }

        try {
            const params = new URLSearchParams();
            itemsId.forEach(id => params.append('itemsId', id));
            params.append('socketId', socketId);


            const response = await fetch('https://bot.kediritechnopark.com/webhook/store-dev/pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                body: params.toString()
            });


            const result = await response.json();

            if (response.ok && result[0].qris_dynamic) {
                setQrisData(result[0].qris_dynamic);
                setValue(result[0].total_price);
            } else {
                alert(`Gagal mendapatkan QRIS: ${result?.error || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('Network error:', error);
            alert("Terjadi kesalahan jaringan.");
        }
    };

    return (
        <div className="checkout-container">
            <div className="left-panel">
                <div className="back-arrow">←</div>
                <div className="brand-name">Powdur</div>
                <div className="product-name">Pure kit</div>
                <div className="product-price">$65.00</div>
                <div className="product-image-container">
                    <img src="path/to/image.jpg" alt="Powdur Product" />
                </div>
            </div>
            <div className="right-panel">
                {!qrisData ? (
                    <>
                        <h3>Cart Items</h3>
                        {loadingProducts ? (
                            <p>Loading products...</p>
                        ) : products.length === 0 ? (
                            <p>No products found</p>
                        ) : (
                            <ul>
                                {products.map((product) => (
                                    <li key={product.id || product._id}>
                                        {product.name} - ${product.price}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <form className="shipping-info" onSubmit={handlePay}>
                            <h3>Shipping information</h3>
                            <input type="email" placeholder="Email" />
                            <input type="text" placeholder="Name" />
                            <select >
                                <option value="United States">United States</option>
                            </select>
                            <input type="text" placeholder="Address" />
                            <a href="#" className="manual-address">Enter address manually</a>

                            <div className="payment-methods">
                                <h3>Payment method</h3>
                                <label>
                                    <input type="radio" name="payment" value="card" />
                                    <span className="icon">💳</span> Card
                                </label>
                                <label>
                                    <input type="radio" name="payment" value="bank" />
                                    <span className="icon">🏦</span> Bank
                                </label>
                                <label>
                                    <input type="radio" name="payment" value="klarna" />
                                    <span className="icon klarna">K</span> Klarna
                                    <div className="klarna-subtext">Buy now pay later</div>
                                </label>
                                <label>
                                    <input type="radio" name="payment" value="ideal" />
                                    <span className="icon ideal">iD</span> iDEAL
                                </label>
                            </div>

                            <button type="submit" className="pay-button">Pay</button>
                        </form>
                    </>
                ) : (
                    <>
                        {transactionSuccess ? (
                            <div className="success-section">
                                <div className="checkmark-container">
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                        <path className="checkmark-check" fill="none" d="M14 27l7 7 16-16" />
                                    </svg>
                                    <h2>Payment Successful!</h2>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="qris-section">
                                    <h3>Scan QRIS to Pay</h3>
                                    <QRCodeCanvas value={qrisData} size={256} />
                                    <p className="qris-string">{qrisData}</p>
                                </div>
                                <h1>{value}</h1>
                            </>
                        )}

                    </>
                )}

                <div className="footer">
                    Powered by <strong>stripe</strong> | Terms | Privacy
                </div>
            </div>
        </div>
    );
};

export default Checkout;
