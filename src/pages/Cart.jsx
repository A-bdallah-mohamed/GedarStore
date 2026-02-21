import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from "../firebase/firebaseconfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";
import Header from '../Components/Header';
import { useGlobal } from '../App';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok, FaTelegramPlane } from "react-icons/fa";

export default function Cart() {
  const { products = [] } = useGlobal() || {};
  const user = auth.currentUser;

  const [cartItems, setCartItems] = useState([]);
  const [totalOrder, setTotalOrder] = useState(0);
  const [totalOrderPercent, setTotalOrderPercent] = useState(0);
  const FREE_SHIPPING_THRESHOLD = 700;
  const SHIPPING_FEE = 65;

  // Fetch cart from Firebase or localStorage
  useEffect(() => {
    if (!products || products.length === 0) return;

    const fetchCart = async () => {
      let rawCart = [];

      if (user) {
        const q = query(collection(db, "Users"), where("User", "==", user.email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data() || {};
          rawCart = Array.isArray(userData.cart) ? userData.cart : [];
        }
      } else {
        try {
          const raw = localStorage.getItem("cart");
          rawCart = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        } catch {
          rawCart = [];
        }
      }

      // Group items by id+price to handle different prices for same product
      const groupedMap = {};
      rawCart.forEach(item => {
        const key = `${item.id}_${item.price}`; // unique key per id+price
        if (!groupedMap[key]) {
          const productInfo = products.find(p => p.id === item.id) || {};
          groupedMap[key] = {
            ...productInfo,
            price: item.price ?? productInfo.price,
            quantity: 1
          };
        } else {
          groupedMap[key].quantity += 1;
        }
      });

      setCartItems(Object.values(groupedMap));
    };

    fetchCart();
  }, [user, products]);

  // Calculate totals
  useEffect(() => {
    const totalPrice = (cartItems || []).reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    setTotalOrder(totalPrice);
    setTotalOrderPercent(Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100));
  }, [cartItems]);

  // Sync cart to Firebase
  const syncCartToFirebase = async updatedCart => {
    if (!user) return;

    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const userDoc = snapshot.docs[0];
    const userRef = doc(db, "Users", userDoc.id);

    // Flatten updatedCart to array of {id, price} for Firebase
    const firebaseCart = updatedCart.flatMap(item =>
      Array(item.quantity).fill({ id: item.id, price: item.price })
    );

    await updateDoc(userRef, { cart: firebaseCart });
  };

  // Increment / decrement quantity
  const increment = (product, delta) => {
    setCartItems(prev => {
      const updated = prev
        .map(item => {
          if (item.id !== product.id || item.price !== product.price) return item;

          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          return { ...item, quantity: newQuantity };
        })
        .filter(Boolean);

      syncCartToFirebase(updated);

      if (!user) {
        const guestCart = updated.flatMap(item =>
          Array(item.quantity).fill({ id: item.id, price: item.price })
        );
        localStorage.setItem("cart", JSON.stringify(guestCart));
      }

      return updated;
    });
  };

  const removeItem = product => {
    setCartItems(prev => {
      const updated = prev.filter(
        item => !(item.id === product.id && item.price === product.price)
      );

      syncCartToFirebase(updated);

      if (!user) {
        const guestCart = updated.flatMap(item =>
          Array(item.quantity).fill({ id: item.id, price: item.price })
        );
        localStorage.setItem("cart", JSON.stringify(guestCart));
      }

      return updated;
    });
  };

  const shippingFee = totalOrder >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const totalWithShipping = totalOrder + shippingFee;

  return (
    <div className='d-flex flex-column cart-page' style={{ minHeight: '100vh', justifyContent: 'space-between' }}>
      <Header />

      <section>
        <div className='w-100 d-flex justify-content-center'>
          <div className='maxw w-100 cart-container' style={{ marginTop: '150px' }}>
            <h2 className='px-5 fw-bold'>Shopping Cart</h2>

            {cartItems.length > 0 ? (
              <>
                <div className='freeshipping w-100 cart-free-card'>
                  {totalOrder < FREE_SHIPPING_THRESHOLD ? (
                    <h5 className='m-0'>Add more items to unlock free shipping.</h5>
                  ) : (
                    <h5 className='m-0'>Congratulations! You unlocked free shipping.</h5>
                  )}

                  {/* <div className='free-ship-pill'>GETTING STARTED</div> */}

                  <div className='w-100 d-flex align-items-center justify-content-between gap-2 free-ship-scale'>
                    <p className='m-0 fw-bold'>0 EGP</p>
                    <div className='inicatorcontainer w-100'>
                      <div className='indicator' style={{ width: `${totalOrderPercent}%` }}></div>
                    </div>
                    <p className='m-0 fw-bold'>{FREE_SHIPPING_THRESHOLD} EGP</p>
                  </div>
                </div>

                <div className='ms-4 row w-100 px-5 mt-4 cartitems-head'>
                    <div className="col-6 fw-bold ps-4 cart-col-head">Product</div>
                    <div className="col-2 fw-bold jc-end cart-col-head">Quantity</div>
                    <div className="col-2 fw-bold jc-end cart-col-head">Total</div>
                  </div>

                  <div className='row w-100   cartitems-grid ms-1 mt-1'>
                    {cartItems.map(product => (
                      <div className="cartitem-card row w-100 mx-0" key={`${product.id}_${product.price}`}>
                        <div className="col-6 d-flex cartitem-main">
                          <div className='cartitemimage'>
                            <img src={product.image} alt={product.name || ""} />
                          </div>
                          <div className='py-2 d-flex flex-column cartitem-info'>
                            <div className='cartitem-title-row'>
                              <div className='productnameincartpage'>
                                {product.name}
                                {product.category === "Frames" && (
                                  parseInt(product.price) === 350 ? <span>(30 x 40)</span> : <span>(20 x 30)</span>
                                )}
                              </div>
                              <span className='cartitem-inline-price'>{product.price}.00 EGP</span>
                            </div>
                            <span className='fw-normal' style={{ fontSize: '12px' }}>{product.category}</span>
                          </div>
                        </div>

                        <div className="col-2 cartitem-qty text-center d-flex gap-3 fw-bold jc-end">
                          <div className='cartitem-qty-controls'>
                            <button className='p-2 cursor-pointer m-0' style={{ height: 40 }} onClick={() => increment(product, -1)} type="button">-</button>
                            <span className='p-2 m-0'>{product.quantity}</span>
                            <button className='p-2 cursor-pointer m-0' style={{ height: 40 }} onClick={() => increment(product, 1)} type="button">+</button>
                          </div>
                        </div>

                        <div className="col-2 cartitem-total jc-end">
                          <span>{product.price * product.quantity}.00 EGP</span>
                        </div>

                        <div className='cartitem-remove'>
                          <button className='cart-remove-btn' onClick={() => removeItem(product)} type="button">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>

                <div className='cart-bottom'>
           

                  <div className='cart-summary'>
                    <div className='cart-summary-row'>
                      <span>Subtotal</span>
                      <span>{totalOrder}.00 EGP</span>
                    </div>
                    <div className='cart-summary-row'>
                      <span>Shipping</span>
                      <span>{shippingFee}.00 EGP</span>
                    </div>
                    <div className='cart-summary-total'>
                      <span>Total</span>
                      <span>{totalWithShipping}.00 EGP</span>
                    </div>
                    <p className='cart-summary-note'>Taxes and shipping calculated at checkout.</p>
                    <Link to="/" className='cart-continue'>Continue Shopping</Link>
                    <Link
                      to="/Checkout"
                      state={{
                        cartItems: cartItems.map((item) => ({
                          productId: item.id,
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          size: item.size || null,
                          category: item.category || "",
                          imageUrl: item.image || item.imageUrl || "",
                        })),
                      }}
                      className='checkout fw-bold underline d-flex align-items-center justify-content-center text-decoration-none'
                    >
                      GO TO CHECKOUT
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <h1 className='w-100 text-center'>Your cart is Currently Empty</h1>
            )}
          </div>
        </div>
      </section>

      <footer className='d-flex align-items-center justify-content-center'>
        <div className='maxw d-flex align-items-center justify-content-center gap-2'>
          <div className='d-flex gap-2'>
            <a href="https://www.instagram.com/gedarstore"><FaInstagram /></a>
            <a href="https://www.tiktok.com/@gedarstore?lang=ar"><FaTiktok /></a>
            <a href="https://t.me/gedarstoreeg"><FaTelegramPlane /></a>
          </div>
        </div>
      </footer>
    </div>





  );
}
