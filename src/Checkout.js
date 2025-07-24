import React from 'react';
import './Checkout.css'; // Assuming you'll create a CSS file for styling

const Checkout = () => {
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
                <button className="apple-pay-button"> Pay</button>
                <div className="separator">
                    <hr className="line" />
                    <span>Or pay another way</span>
                    <hr className="line" />
                </div>
                <form className="shipping-info">
                    <h3>Shipping information</h3>
                    <input type="email" placeholder="Email" required />
                    <input type="text" placeholder="Name" required />
                    <select required>
                        <option value="United States">United States</option>
                    </select>
                    <input type="text" placeholder="Address" required />
                    <a href="#" className="manual-address">Enter address manually</a>
                </form>
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
                <div className="footer">
                    Powered by <strong>stripe</strong> | Terms | Privacy
                </div>
            </div>
        </div>
    );
};

export default Checkout;