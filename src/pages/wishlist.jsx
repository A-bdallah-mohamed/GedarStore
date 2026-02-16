import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase/firebaseconfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";
import Header from "../Components/Header";
import { useNavigate } from "react-router-dom";
import { useGlobal } from '../App';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok, FaTelegramPlane } from "react-icons/fa";

const slugify = (str) =>
  str
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export default function Wishlist() {
  const navigate = useNavigate();
    const { products } = useGlobal();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadWishlist = async () => {
        const q = query(collection(db, "Users"), where("User", "==", user.email));
        const snapshot = await getDocs(q);
        let itemsids ;
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data() || {};
            itemsids = userData.wishlist || [];
        }
        console.log('itemsids',itemsids);
console.log('2',itemsids);
const wishlistitems = products.filter((p) =>
  itemsids.some((item) => item.id === p.id)
); console.log("Wishlist items:", wishlistitems);
 setWishlist(wishlistitems);

      setLoading(false);
    };

    loadWishlist();
  }, [user]);

  const removeFromWishlist = async (productId) => {
    if (!user) return;  
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() || {};
    const userId = userDoc.id;
    const newWishlist = (userData.wishlist || []).filter(item => item.id !== productId);
    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, { ...userData, wishlist: newWishlist });
        console.log('newWishlist:', newWishlist); 

    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  return (
        <div className='d-flex flex-column' style={{ minHeight: '100vh', justifyContent: 'space-between' }}>
          <Header />
    
    <div className="page-content" style={{ marginTop: "120px", paddingTop: "50px" }}>
      <div className="maxw minw px-5">
        <h2 style={{ fontWeight: 600, marginBottom: "20px" }}>My Wishlist</h2>

        {loading ? (
          <div>Loading...</div>
        ) : wishlist.length === 0 ? (
          <div className="alert alert-info">Your wishlist is empty</div>
        ) : (
          <div className="row g-4">
            {wishlist.map((item) => (
              <div className="col-12 col-md-4 col-lg-3" key={item.productId}>
                <div className="card h-100">
                  <Link to={`/products/${slugify(item.name)}`} className="navlink">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="card-img-top"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  </Link>
                  <div className="card-body d-flex flex-column">
                    <Link to={`/products/${slugify(item.name)}`} className="navlink">
                      <h6 style={{ fontWeight: 600 }}>{item.name}</h6>
                    </Link>
                    <p className="text-muted mb-2">{item.category}</p>
<p style={{ fontWeight: 600, color: "#ff6344" }}>
  {item.category === "Frames"
    ? `From ${item.smallframeprice}`
    :  `LE ${item.price}`}
</p>                    <button
                      className="btn btn-outline-danger btn-sm mt-auto"
onClick={()=>removeFromWishlist(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
