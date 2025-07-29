import React from 'react';
import styles from './Checkout.module.css';

const Checkout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      boxSizing: 'border-box',
    }}>
      <div className={styles.checkoutCard}>
        {/* Product List */}
        <div className={styles.cartSection}>
          <h2 className={styles.cartTitle}>Your Cart</h2>
          <ul className={styles.cartList}>
            <li className={styles.cartItem}>
              <div className={styles.itemDetails}>
                <img
                  src="https://via.placeholder.com/60"
                  alt="Product 1"
                  className={styles.productImage}
                />
                <div>
                  <p className={styles.itemText}>Pure Kit</p>
                  <p className={styles.itemPrice}>$65.00</p>
                </div>
              </div>
              <button className={styles.removeBtn} aria-label="Remove Pure Kit">&times;</button>
            </li>

            <li className={styles.cartItem}>
              <div className={styles.itemDetails}>
                <img
                  src="https://via.placeholder.com/60"
                  alt="Product 2"
                  className={styles.productImage}
                />
                <div>
                  <p className={styles.itemText}>Energy Drink</p>
                  <p className={styles.itemPrice}>$25.00</p>
                </div>
              </div>
              <button className={styles.removeBtn} aria-label="Remove Energy Drink">&times;</button>
            </li>
          </ul>
        </div>

        {/* Checkout form */}
        <div className={styles.checkoutSection}>
          <div>
            <h2 className={styles.checkoutTitle}>Note / Request</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Optional notes for seller"
                className={styles.inputNote}
              />
            </div>
            <button className={styles.paymentBtn}>Complete Payment</button>
          </div>

          {/* Footer */}
          <div className={styles.footerText}>
            Powered by <span className={styles.footerHighlight}>Stripe</span> •{' '}
            <a href="#" className={styles.footerLink}>Terms</a> •{' '}
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
