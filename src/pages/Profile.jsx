import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseconfig";
import {collection,query,where,getDocs,doc,updateDoc,} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header";
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";


export default function Profile() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // ====== REDIRECT IF NOT LOGGED IN ======
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // ====== FETCH USER DATA & ORDERS ======
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user info
        const userQuery = query(
          collection(db, "Users"),
          where("User", "==", user.email)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const data = userSnapshot.docs[0].data();
          setUserData(data);
          setFormData({
            fullName: data.fullName || "",
            phone: data.phone || "",
            city: data.city || "",
            address: data.address || "",
          });
        }

        // Fetch user orders
        const ordersQuery = query(
          collection(db, "Orders"),
          where("userId", "==", user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        // Sort by timestamp (newest first)
        ordersData.sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ====== SAVE USER DATA ======
  const handleSaveProfile = async () => {
    if (!user) return;

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.address.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const userQuery = query(
        collection(db, "Users"),
        where("User", "==", user.email)
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDocId = userSnapshot.docs[0].id;
        const userRef = doc(db, "Users", userDocId);

        await updateDoc(userRef, {
          fullName: formData.fullName,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
        });

        setUserData(formData);
        setEditing(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="text-center mt-5">
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (

    <div className='d-flex flex-column'>

    <section className=''>
        <Header />
    <div className="page-content">
      <div className="maxw minw" style={{ marginTop: "120px",paddingTop:'50px' }}>
        {/* ===== CUSTOMER INFO SECTION ===== */}
        <div className="row mb-5">
          <div className="col-md-8">
            <h2 className="fw-bold mb-4">My Profile</h2>

            <div className="card" style={{ borderRadius: "10px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0">Account Information</h5>
                  {!editing && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {!editing ? (
                  <>
                    <div className="row">
                      <div className="col-md-6">
                        <p className="text-muted">Email Address</p>
                        <p className="fw-bold">{user.email}</p>
                      </div>

                      <div className="col-md-6">
                        <p className="text-muted">Account Created</p>
                        <p className="fw-bold">
                          {user.metadata?.creationTime
                            ? new Date(user.metadata.creationTime).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {userData && (
                      <>
                        <hr />
                        <h6 className="mb-3 mt-3">Saved Addresses</h6>

                        <div className="row">
                          <div className="col-md-6">
                            <p className="text-muted">Full Name</p>
                            <p className="fw-bold">{userData.fullName || "N/A"}</p>
                          </div>

                          <div className="col-md-6">
                            <p className="text-muted">Phone Number</p>
                            <p className="fw-bold">{userData.phone || "N/A"}</p>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6">
                            <p className="text-muted">City</p>
                            <p className="fw-bold">{userData.city || "N/A"}</p>
                          </div>

                          <div className="col-md-6">
                            <p className="text-muted">Address</p>
                            <p className="fw-bold">{userData.address || "N/A"}</p>
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      className="btn btn-outline-dark mt-3"
                      onClick={() => {
                        auth.signOut().then(() => navigate("/login"));
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div className="mb-3">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        placeholder="Enter your city"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Address *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="Enter your full address"
                        required
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            fullName: userData?.fullName || "",
                            phone: userData?.phone || "",
                            city: userData?.city || "",
                            address: userData?.address || "",
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== ORDERS SECTION ===== */}
        <div className="row">
          <div className="col-12">
            <h2 className="fw-bold mb-4">Order History</h2>

            {orders.length === 0 ? (
              <div className="card" style={{ borderRadius: "10px" }}>
                <div className="card-body text-center py-5">
                  <p className="text-muted">No orders yet</p>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {orders.map((order) => {
                  const isOpen = openOrderId === order.id;
                  return (
                    <div key={order.id} className="card" style={{ borderRadius: "10px" }}>
                      <div
                        role="button"
                        className="p-3"
                        onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between w-100 align-items-center">
                          <div>
                            <strong>Order #{order.orderId}</strong>
                            <br />
                            <small className="text-muted">
                              {order.timestamp
                                ? new Date(
                                    order.timestamp.toMillis?.() ||
                                      order.timestamp
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </small>
                          </div>
                          <div className="text-end">
                            <strong style={{ fontSize: "1.1em", color: "#28a745" }}>
                              {order.total} EGP
                            </strong>
                            <br />
                            <small className="text-muted">
                              {isOpen ? "Hide details" : "View details"}
                            </small>
                          </div>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="card-body border-top">
                          <h6 className="mb-2">Items</h6>
                          {order.items && order.items.length > 0 ? (
                            <ul className="mb-3">
                              {order.items.map((item, itemIdx) => (
                                <li key={itemIdx}>
                                  {item.name} × {item.quantity} — {item.price} EGP
                                  {item.size ? ` (Size: ${item.size})` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted">No items found</p>
                          )}

                          <div className="mb-2"><strong>Subtotal:</strong> {order.subtotal} EGP</div>
                          <div className="mb-2"><strong>Shipping:</strong> {order.shipping} EGP</div>
                          <div className="mb-2"><strong>Total:</strong> {order.total} EGP</div>

                          <hr />

                          <div className="mb-2"><strong>Payment:</strong> {order.paymentMethod?.toUpperCase() || "N/A"}</div>
                          <div className="mb-2"><strong>Status:</strong> {order.status?.replace("_", " ").toUpperCase() || "PENDING"}</div>
                          <div className="mb-2"><strong>Payment Status:</strong> {order.paymentStatus?.toUpperCase() || "PENDING"}</div>

                          <hr />

                          <div className="mb-2"><strong>Customer:</strong> {order.customer?.fullName || "N/A"}</div>
                          <div className="mb-2"><strong>Phone:</strong> {order.customer?.phone || "N/A"}</div>
                          <div className="mb-2"><strong>City:</strong> {order.customer?.city || "N/A"}</div>
                          <div className="mb-2"><strong>Address:</strong> {order.customer?.address || "N/A"}</div>
                          {order.customer?.notes && (
                            <div className="mb-2"><strong>Notes:</strong> {order.customer.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </section>
    
        <footer className='d-flex align-items-center justify-content-center '>
      <div className='maxw d-flex align-items-center justify-content-center gap-2'>
        <div className='d-flex gap-2'>
          <a href="https://www.instagram.com/gedarstore?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="><FaInstagram /></a>
          <a href="https://www.tiktok.com/@gedarstore?lang=ar"><FaTiktok />
    </a>
    <a href="https://t.me/gedarstoreeg"><FaTelegramPlane />
    </a>
    </div>
    
      </div>
    </footer>

    </div>

  );
}
