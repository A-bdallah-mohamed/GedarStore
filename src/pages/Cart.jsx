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
    setTotalOrderPercent(Math.min((totalPrice / 200) * 100, 100));
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

  return (
    <div className='d-flex flex-column' style={{ minHeight: '100vh', justifyContent: 'space-between' }}>
      <Header />

      <section>
        <div className='w-100 d-flex justify-content-center'>
          <div className='maxw w-100' style={{ marginTop: '150px' }}>
            <h2 className='px-5 fw-bold'>Shopping Cart</h2>

            {cartItems.length > 0 ? (
              <>
                <div className='freeshipping w-100'>
                  {totalOrder < 200 ? (
                    <h5 className='m-0'>
                      Great! You are {200 - totalOrder} EGP Away from Getting <span>Free Shipping</span>
                    </h5>
                  ) : (
                    <h5 className='m-0'>
                      Congratulations!🎉 you now have <span>Free Shipping</span>
                    </h5>
                  )}

                  <div className='w-100 d-flex align-items-center justify-content-center gap-2' style={{ marginTop: '20px' }}>
                    <p className='m-0 fw-bold'>EGP 0</p>
                    <div className='inicatorcontainer w-50'>
                      <div className='indicator' style={{ width: `${totalOrderPercent}%` }}></div>
                    </div>
                    <div className='text-center'>
                      <p className='m-0 fw-bold'>200EGP</p>
                      <p className='m-0 fw-bold'>Free Shipping</p>
                    </div>
                  </div>

                  <div className='row w-100 px-5 mt-5'>
                    <div className="col-6 fw-bold ps-4">Product</div>
                    <div className="col-2 fw-bold jc-end">Price</div>
                    <div className="col-2 fw-bold jc-end">Quantity</div>
                    <div className="col-2 fw-bold jc-end">Total</div>

                    {cartItems.map(product => (
                      <React.Fragment key={`${product.id}_${product.price}`}>
                        <div className="col-6 d-flex mt-4">
                          <div className='cartitemimage'><img src={product.image} alt="" /></div>
                          <div className='py-4 d-flex flex-column'>
                            <p className='m-0 productnameincartpage'>{product.name}{product.category === "Frames" ? <>
                            {product.price === 250 ? <span>(20 x 30)</span> : <span>(30 x 40)</span>}
                            </> : <></>}</p>
                            <p className='m-0 fw-normal' style={{ fontSize: '12px' }}>{product.category}</p>
                          </div>
                        </div>
                        <div className="col-2 mt-4 pt-3 jc-end">{product.price}.00 EGP</div>
                        <div className="col-2 mt-4 pt-3 text-center d-flex gap-3 fw-bold jc-end">
                          <p className='p-2 cursor-pointer m-0' style={{ height: 40 }} onClick={() => increment(product, -1)}>-</p>
                          <p className='p-2 m-0'>{product.quantity}</p>
                          <p className='p-2 cursor-pointer m-0' style={{ height: 40 }} onClick={() => increment(product, 1)}>+</p>
                        </div>
                        <div className="col-2 mt-4 pt-3 jc-end">{product.price * product.quantity}.00 EGP</div>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className='w-100 d-flex align-items-end justify-content-center pe-5 mt-4 flex-column'>
                    <p className='fw-bold fs-4 m-0'>Sub Total: {totalOrder + 45}.00 EGP</p>
                    <div className='d-flex align-items-center mt-3 gap-3'>
                      <Link to="/"><p className='m-0 text-decoration-underline fw-bold cursor-pointer'>Continue Shopping</p></Link>
                      <button className='checkout fw-bold underline'>GO TO CHECKOUT</button>
                    </div>
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
