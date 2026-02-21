import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebaseconfig";
import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { useGlobal } from "../App";
import { calculateBogoDiscount, calculateCategoryDiscount } from "../utils/discounts";

const SHIPPING_COST = 65;
const FREE_SHIPPING_LIMIT = 700;

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.currentUser;
  const globalState = useGlobal() || {};
  const coupons = Array.isArray(globalState.coupons) ? globalState.coupons : [];

  const [cartItems, setCartItems] = useState(location.state?.cartItems || []);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(SHIPPING_COST);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedAddress, setSavedAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [categoryDiscount, setCategoryDiscount] = useState(0);
  const [bogoDiscount, setBogoDiscount] = useState(0);
  const [bogoDetails, setBogoDetails] = useState([]);

  const getUserDocRef = useCallback(async () => {
    if (!user?.email) return null;
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return doc(db, "Users", snapshot.docs[0].id);
  }, [user?.email]);

  const resolveItemPrice = useCallback((item, data) => {
    const savedPrice = Number(item?.price || 0);
    if (savedPrice > 0) return savedPrice;

    if (item?.size === "20x30") {
      return Number(data.smallFrameprice || data.smallframeprice || data.price || 0);
    }

    if (item?.size === "30x40") {
      return Number(data.bigframeprice || data.largeframeprice || data.price || 0);
    }

    return Number(
      data.price || data.smallFrameprice || data.smallframeprice || data.largeframeprice || 0
    );
  }, []);

  const normalizeCartEntries = useCallback((cartData = []) => {
    const groupedEntries = {};

    cartData.forEach((rawItem) => {
      const productId = typeof rawItem === "string"
        ? rawItem
        : rawItem?.productId || rawItem?.id || null;

      if (!productId || typeof productId !== "string") return;

      const quantity = Math.max(1, Number(rawItem?.quantity || 1));
      const itemPrice = Number(rawItem?.price || 0);
      const itemSize = rawItem?.size || null;
      const key = `${productId}__${itemSize || "default"}__${itemPrice}`;

      if (!groupedEntries[key]) {
        groupedEntries[key] = {
          productId,
          size: itemSize,
          price: itemPrice,
          quantity,
          category: rawItem?.category || "",
          imageUrl: rawItem?.imageUrl || rawItem?.image || "",
          name: rawItem?.name || "",
        };
      } else {
        groupedEntries[key].quantity += quantity;
      }
    });

    return Object.values(groupedEntries);
  }, []);

  const mapCartDataToItems = useCallback(async (cartData) => {
    const normalizedItems = normalizeCartEntries(cartData);

    const itemsWithDetails = await Promise.all(
      normalizedItems.map(async (item) => {
        try {
          const productId = item?.productId || item?.id;

          if (!productId || typeof productId !== "string") {
            return null;
          }

          const productDoc = await getDoc(doc(db, "Products", productId));
          if (!productDoc.exists()) return null;

          const data = productDoc.data();
          const price = resolveItemPrice(item, data);

          return {
            productId,
            name: data.name || "Unknown",
            price,
            imageUrl: item?.imageUrl || data.imageUrl || data.image || "",
            quantity: Number(item?.quantity || 1),
            size: item?.size || null,
            category: data.category || item?.category || "",
          };
        } catch (err) {
          console.error("Error fetching product:", err);
          return null;
        }
      })
    );

    return itemsWithDetails.filter((item) => item !== null);
  }, [normalizeCartEntries, resolveItemPrice]);

  const safeParseJSON = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error("Invalid JSON in localStorage cart:", error);
      return fallback;
    }
  };

  // -------- LOAD SAVED ADDRESS --------
  useEffect(() => {
    let isMounted = true;

    const loadSavedAddress = async () => {
      if (user) {
        try {
          const userRef = await getUserDocRef();
          if (userRef) {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            if (userData.fullName && userData.phone && userData.city && userData.address) {
              if (isMounted) {
                setSavedAddress(userData);
              }
            }
          }
        } catch (error) {
          console.error("Error loading saved address:", error);
        }
      }
    };

    loadSavedAddress();

    return () => {
      isMounted = false;
    };
  }, [user, getUserDocRef]);

  // -------- USE SAVED ADDRESS --------
  useEffect(() => {
    if (useSavedAddress && savedAddress) {
      setFormData({
        fullName: savedAddress.fullName || "",
        phone: savedAddress.phone || "",
        city: savedAddress.city || "",
        address: savedAddress.address || "",
        notes: formData.notes,
      });
    }
  }, [useSavedAddress, savedAddress, formData.notes]);

  // -------- LOAD CART --------
  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      if (location.state?.cartItems && location.state.cartItems.length > 0) {
        const normalizedStateItems = location.state.cartItems
          .map((item) => ({
            ...item,
            productId: item?.productId || item?.id || null,
            quantity: Math.max(1, Number(item?.quantity || 1)),
            imageUrl: item?.imageUrl || item?.image || "",
          }))
          .filter((item) => item.productId);

        if (isMounted) {
          setCartItems(normalizedStateItems);
        }
        return;
      }

      try {
        let rawCart = [];

        if (user) {
          const userRef = await getUserDocRef();
          if (userRef) {
            const userDoc = await getDoc(userRef);
            rawCart = userDoc.exists() ? userDoc.data().cart || [] : [];
          }
        } else {
          rawCart = safeParseJSON(localStorage.getItem("cart"), []);
        }

        if (!Array.isArray(rawCart) || rawCart.length === 0) {
          if (isMounted) {
            setCartItems([]);
          }
          return;
        }

        const itemsWithDetails = await mapCartDataToItems(rawCart);
        if (isMounted) {
          setCartItems(itemsWithDetails);
        }
      } catch (error) {
        console.error("Cart load error:", error);
        if (isMounted) {
          setCartItems([]);
        }
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [location.state, user, getUserDocRef, mapCartDataToItems]);

  // -------- CALCULATE TOTALS --------
  useEffect(() => {
    let sum = 0;
    cartItems.forEach((item) => {
      sum += (item.price || 0) * (item.quantity || 1);
    });
    setSubtotal(sum);

    const shippingCost = sum >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_COST;
    setShipping(shippingCost);
    
    const categoryResult = calculateCategoryDiscount(cartItems, coupons);
    const bogoResult = calculateBogoDiscount(cartItems, coupons);
    const autoDiscountAmount = categoryResult.total + bogoResult.total;

    setCategoryDiscount(categoryResult.total);
    setBogoDiscount(bogoResult.total);
    setBogoDetails(bogoResult.details || []);

    const subtotalAfterAuto = Math.max(0, sum - autoDiscountAmount);

    // Calculate coupon discount
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      const discountValue = Number(appliedCoupon.discountValue || 0);
      if (appliedCoupon.discountType === "percentage") {
        couponDiscountAmount = (subtotalAfterAuto * discountValue) / 100;
      } else {
        couponDiscountAmount = discountValue;
      }
    }

    couponDiscountAmount = Math.max(0, Math.min(subtotalAfterAuto, couponDiscountAmount || 0));

    const totalDiscountAmount = autoDiscountAmount + couponDiscountAmount;

    setCouponDiscount(couponDiscountAmount);
    setDiscount(totalDiscountAmount);
    setTotal(Math.max(0, sum + shippingCost - totalDiscountAmount));
  }, [cartItems, appliedCoupon, coupons]);

  // -------- VALIDATE PHONE --------
  const validatePhone = (phone) => {
    const egyptianRegex = /^01[0-2,5]\d{8}$/;
    return egyptianRegex.test(phone);
  };

  // -------- APPLY COUPON --------
  const applyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      const couponsRef = collection(db, "Coupons");
      const q = query(couponsRef, where("code", "==", normalizedCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      const couponData = snapshot.docs[0].data();
      const couponId = snapshot.docs[0].id;

      const inferredRuleType = couponData.ruleType
        ? couponData.ruleType
        : couponData.buyQty || couponData.getQty
        ? "bogo"
        : couponData.category
        ? "category"
        : "coupon";

      if (inferredRuleType !== "coupon") {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      // Check if coupon is active
      if (couponData.isActive === false) {
        setCouponError("This coupon is inactive");
        setAppliedCoupon(null);
        return;
      }

      if (couponData.expiryDate) {
        const expiryDate = couponData.expiryDate.toDate
          ? couponData.expiryDate.toDate()
          : new Date(couponData.expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!Number.isNaN(expiryDate.getTime()) && expiryDate < today) {
          setCouponError("This coupon has expired");
          setAppliedCoupon(null);
          return;
        }
      }

      const maxUses = Number(couponData.maxUses || 0);
      const currentUses = Number(couponData.currentUses || 0);
      if (maxUses > 0 && currentUses >= maxUses) {
        setCouponError("This coupon has reached its maximum usage limit");
        setAppliedCoupon(null);
        return;
      }

      // Apply coupon
      setAppliedCoupon({ ...couponData, id: couponId });
      setCouponError("");
      alert("✅ Coupon applied successfully!");
    } catch (error) {
      console.error("Error applying coupon:", error);
      setCouponError("Error applying coupon");
    }
  };

  // -------- REMOVE COUPON --------
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // -------- CLEAR CART --------
  const clearCartStorage = async () => {
    localStorage.removeItem("cart");

    if (!user) return;

    try {
      const userRef = await getUserDocRef();
      if (userRef) {
        await updateDoc(userRef, { cart: [] });
      }
    } catch (error) {
      console.error("Error clearing user cart:", error);
    }
  };

  // -------- VALIDATE FORM --------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!validatePhone(formData.phone)) newErrors.phone = "Invalid Egyptian phone number";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------- GENERATE ORDER ID --------
  const generateOrderId = () => {
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, "0");
    return `GDR-2026-${random}`;
  };

  // -------- GENERATE REFERENCE CODE --------
  const generateRefCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const submitOrder = async (method) => {
    if (!validateForm()) return;
    if (!user) {
      alert("Please sign in first");
      navigate("/login");
      return;
    }
    if (!cartItems.length) {
      alert("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const orderId = generateOrderId();
      const isInstaPay = method === "instapay";
      const refCode = isInstaPay ? generateRefCode() : null;

      const orderData = {
        orderId,
        userId: user.uid,
        customer: formData,
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size || null,
        })),
        subtotal,
        shipping,
        discount,
        categoryDiscount,
        bogoDiscount,
        couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        notes: formData.notes || "",
        total,
        paymentMethod: method,
        paymentStatus: "pending",
        status: isInstaPay ? "waiting_for_whatsapp" : "processing",
        ...(isInstaPay ? { referenceCode: refCode } : {}),
        timestamp: serverTimestamp(),
      };

      console.log("📝 Saving order to Firestore:", orderData);
      await addDoc(collection(db, "Orders"), orderData);
      console.log("✅ Order saved successfully with ID:", orderId);
      
      if (appliedCoupon) {
        const couponRef = doc(db, "Coupons", appliedCoupon.id);
        await updateDoc(couponRef, {
          currentUses: Number(appliedCoupon.currentUses || 0) + 1
        });
      }
      
      await clearCartStorage();
      alert(
        isInstaPay
          ? "Order created successfully! Our team will contact you shortly."
          : "Order confirmed successfully! Our team will contact you shortly."
      );
      navigate("/");
    } catch (error) {
      console.error("Error creating order:", error);
      alert("An error occurred, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleCOD = () => submitOrder("cod");

  const handleInstaPay = () => submitOrder("instapay");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="page-content checkout-page" style={{ minHeight: "100vh", paddingTop: "110px" }}>
      <div className="maxw">
        <h1 className="mb-5 text-center" style={{ marginTop: "12px" }}>Checkout</h1>

        <div className="row">
          {/* LEFT SIDE - FORM */}
          <div className="col-lg-7 order-2 order-lg-1">
            <div className="card p-4 mb-4">
              <h5 className="mb-4">📍 Shipping Information</h5>

              {/* Saved Address Option */}
              {savedAddress && (
                <div className="mb-4 p-3 border rounded" style={{ backgroundColor: "#f9f9f9" }}>
                  <div className="d-flex align-items-start gap-3">
                    <input
                      type="radio"
                      id="useSavedAddress"
                      name="addressOption"
                      checked={useSavedAddress}
                      onChange={(e) => setUseSavedAddress(e.target.checked)}
                      style={{ marginTop: "5px" }}
                    />
                    <div className="flex-grow-1">
                      <label htmlFor="useSavedAddress" className="form-label mb-2" style={{ cursor: "pointer" }}>
                        <strong>Use Saved Address</strong>
                      </label>
                      <div className="text-muted small">
                        <p className="mb-1">
                          <strong>{savedAddress.fullName}</strong> | {savedAddress.phone}
                        </p>
                        <p className="mb-0">
                          {savedAddress.city}, {savedAddress.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Address Option - Enter New */}
              {savedAddress && (
                <div className="mb-4 p-3 border rounded" style={{ backgroundColor: "#f9f9f9" }}>
                  <div className="d-flex align-items-start gap-3">
                    <input
                      type="radio"
                      id="useNewAddress"
                      name="addressOption"
                      checked={!useSavedAddress}
                      onChange={(e) => setUseSavedAddress(!e.target.checked)}
                      style={{ marginTop: "5px" }}
                    />
                    <label htmlFor="useNewAddress" className="form-label mb-0" style={{ cursor: "pointer" }}>
                      <strong>Enter New Address</strong>
                    </label>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  disabled={useSavedAddress}
                />
                {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01001234567"
                  disabled={useSavedAddress}
                />
                {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  className={`form-control ${errors.city ? "is-invalid" : ""}`}
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Cairo"
                  disabled={useSavedAddress}
                />
                {errors.city && <div className="invalid-feedback d-block">{errors.city}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Address *</label>
                <textarea
                  className={`form-control ${errors.address ? "is-invalid" : ""}`}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street... - Area..."
                  rows="2"                  disabled={useSavedAddress}                ></textarea>
                {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Example: Deliver in the morning"
                  rows="2"
                ></textarea>
              </div>

              <hr />

              <h5 className="mb-4">💳 Payment Method</h5>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="paymentMethod"
                  id="cod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <label className="form-check-label" htmlFor="cod">
                  💰 Cash on Delivery
                </label>
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="radio"
                  name="paymentMethod"
                  id="instapay"
                  value="instapay"
                  checked={paymentMethod === "instapay"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <label className="form-check-label" htmlFor="instapay">
                  📱 InstaPay via WhatsApp
                </label>
              </div>

              {paymentMethod === "cod" && (
                <button
                  className="btn btn-success w-100 btn-lg"
                  onClick={handleCOD}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Confirm Order"}
                </button>
              )}

              {paymentMethod === "instapay" && (
                <button
                  className="btn btn-primary w-100 btn-lg"
                  onClick={handleInstaPay}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "💬 Pay via WhatsApp"}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - SUMMARY */}
          <div className="col-lg-5 order-1 order-lg-2 mb-3 mb-lg-0">
            <div
              className="card p-4"
              style={{
                position: "sticky",
                top: "110px",
              }}
            >
              <h5 className="mb-4">📦 Order Summary</h5>

              <div className="mb-4" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {cartItems && cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={`${item.productId || item.name}-${item.size || "default"}`} className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-start" style={{ flex: 1 }}>
                        <img src={item.imageUrl || item.image || ""} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", marginRight: "10px", flexShrink: 0 }} />
                        <div>
                          <span>{item.name}</span>
                          <br />
                          <small className="text-muted">× {item.quantity} @ {item.price || 0} EGP each</small>
                        </div>
                      </div>
                      <span className="fw-bold ms-2">{(item.price || 0) * item.quantity} EGP</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">Cart is empty</p>
                )}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{subtotal} EGP</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>Shipping:</span>
                <span className={shipping === 0 ? "text-success" : ""}>
                  {shipping === 0 ? "Free ✨" : `${shipping} EGP`}
                </span>
              </div>

              {/* COUPON CODE SECTION */}
              <div className="mb-3">
                <label className="form-label fw-bold">🎟️ Coupon Code</label>
                {!appliedCoupon ? (
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className={`form-control ${couponError ? 'is-invalid' : ''}`}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="Enter code"
                    />
                    <button 
                      className="btn btn-outline-primary" 
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success d-flex justify-content-between align-items-center mb-0 p-2">
                    <span>✅ {appliedCoupon.code}</span>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={removeCoupon}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && <div className="text-danger small mt-1">{couponError}</div>}
              </div>

              {categoryDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Category discount:</span>
                  <span>- {categoryDiscount.toFixed(2)} EGP</span>
                </div>
              )}

              {bogoDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>
                    BOGO discount
                    {bogoDetails.length > 0 && (
                      <span style={{ marginLeft: "6px", color: "#6c757d" }}>
                        ({bogoDetails.reduce((sum, d) => sum + (d.freeQty || 0), 0)} gifts)
                      </span>
                    )}
                    :
                  </span>
                  <span>- {bogoDiscount.toFixed(2)} EGP</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Coupon discount:</span>
                  <span>- {couponDiscount.toFixed(2)} EGP</span>
                </div>
              )}

              {discount > 0 && (
                <div className="d-flex justify-content-between mb-3 text-success">
                  <span>Total discount:</span>
                  <span>- {discount.toFixed(2)} EGP</span>
                </div>
              )}

              {subtotal < FREE_SHIPPING_LIMIT && shipping > 0 && (
                <p className="text-muted small mb-3">
                  Add {FREE_SHIPPING_LIMIT - subtotal} EGP for free shipping
                </p>
              )}

              <hr />

              <h6 className="d-flex justify-content-between">
                <span>Total:</span>
                <span className="text-danger fw-bold">{total} EGP</span>
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}