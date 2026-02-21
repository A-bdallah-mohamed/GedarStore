import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { sendWhatsAppToCustomer, buildOrderConfirmationMessage } from "../services/whatsappService";

export default function Dashboard() {

  // Check admin status on mount
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("📱 Dashboard User:", user);
      if (!user) {
        console.warn("⚠️ No user in localStorage");
      } else if (user.Admin) {
        console.log("✅ Admin user detected");
      } else {
        console.warn("⚠️ User is not admin");
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  }, []);

  // helper to detect business name from user document (support multiple possible keys)
  const getBusinessName = (u) => {
    return (
      u.businessName || u.business || u.company || u.workName || u.Work || u.Business || null
    );
  };

  // return array of extra user fields (excluding main columns)
  const getExtraFields = (u) => {
    const exclude = ["id", "fullName", "Name", "User", "phone", "city", "address", "Method", "Admin"];
    return Object.entries(u)
      .filter(([k, v]) =>
        !exclude.includes(k) && v !== undefined && v !== null && k !== "" && !k.toLowerCase().includes("pass")
      )
      .map(([k, v]) => {
        // format value for compact display; use title for full content on hover
        if (typeof v === "object") {
          let title = "";
          try {
            title = JSON.stringify(v);
          } catch (e) {
            title = String(v);
          }
          const label = Array.isArray(v) ? `${v.length} item(s)` : `${Object.keys(v || {}).length} prop(s)`;
          return { k, v, label, title };
        }

        if (typeof v === "string") {
          const isBase64 = (v.startsWith("data:")) || (v.length > 300 && /^[A-Za-z0-9+/=\n\r]+$/.test(v.slice(0, 200)));
          if (isBase64) {
            return { k, v, label: "(long data)", title: v.slice(0, 500) + "..." };
          }
          const trimmed = v.length > 90 ? v.slice(0, 80) + "..." : v;
          return { k, v, label: trimmed, title: v };
        }

        return { k, v, label: String(v), title: String(v) };
      });
  };

  const sanitizeDisplayValue = (key, value) => {
    if (!value) return "---";
    if ((key || "").toLowerCase().includes("pass")) return "***hidden***";
    if (typeof value === "string") {
      if (value.toLowerCase().includes("password")) return "***hidden***";
      if (value.length > 200) return value.slice(0, 120) + "...";
      return value;
    }
    return String(value);
  };

    // Try to extract a cart structure from user document
    const extractCart = (u) => {
      const possibleKeys = ["cart", "Cart", "cartItems", "basket", "basketItems"];
      let raw = null;
      for (const k of possibleKeys) {
        if (u[k] !== undefined && u[k] !== null) {
          raw = u[k];
          break;
        }
      }
      if (!raw) return null;

      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          raw = parsed;
        } catch (e) {
          return { summary: String(raw) };
        }
      }

      if (Array.isArray(raw)) return { items: raw };

      if (typeof raw === "object") {
        if (raw.items && Array.isArray(raw.items)) return { items: raw.items };
        const values = Object.values(raw);
        const allObjects = values.length > 0 && values.every(v => typeof v === 'object');
        if (allObjects) return { items: values };
        return { summary: raw };
      }

      return { summary: raw };
    };

    const openCartModalForUser = (u) => {
      const cart = extractCart(u);
      setCartContent(cart);
      setCartOwnerName(u.fullName || u.Name || u.User || "User");
      setShowCartModal(true);
    };

    // Normalize various cart item shapes into {name,image,price,quantity}
    const normalizeCartItems = (items) => {
      if (!items || !Array.isArray(items)) return [];
      return items.map((it) => {
        if (typeof it === 'string') {
          const raw = it.replace?.(/^"|"$/g, '') || it;
          const prod = products.find(p => p.id === raw || p.id === it);
          if (prod) {
            return {
              name: prod.name || prod.title || prod.productName || prod.id,
              image: prod.image || null,
              price: prod.price ?? prod.smallframeprice ?? prod.bigframeprice ?? 0,
              quantity: 1,
            };
          }
          return { name: raw.length > 60 ? raw.slice(0, 50) + '...' : raw, image: null, price: 0, quantity: 1 };
        }

        if (typeof it === 'object') {
          const pid = it.productId || it.id || it.prodId || it._id || it.product;
          let prod = null;
          if (pid) prod = products.find(p => p.id === pid || p.id === String(pid));
          const name = it.name || it.title || (prod && (prod.name || prod.title)) || JSON.stringify(it).slice(0, 40);
          const image = it.image || (prod && prod.image) || null;
          const price = Number(it.price ?? it.unitPrice ?? it.p ?? (prod && (prod.price ?? prod.smallframeprice ?? prod.bigframeprice)) ?? 0);
          const quantity = Number(it.quantity ?? it.qty ?? it.count ?? 1);
          return { name, image, price, quantity };
        }

        return { name: String(it), image: null, price: 0, quantity: 1 };
      });
    };
  useEffect(() => {
    // ÏÑÏ«┘üÏºÏí Ïº┘ä┘ç┘èÏ»Ï▒ ┘êÏÂÏ¿ÏÀ Ïº┘äÏÁ┘üÏ¡Ï® ┘ä┘äÏ»ÏºÏ┤Ï¿┘êÏ▒Ï»
    const headerContainer = document.querySelector('.headercontainer');
    const body = document.body;
    
    if (headerContainer) {
      headerContainer.style.display = 'none';
    }
    body.style.overflow = 'hidden';

    return () => {
      // ÏÑÏ©┘çÏºÏ▒ Ïº┘ä┘ç┘èÏ»Ï▒ Ï╣┘åÏ» ┘àÏ║ÏºÏ»Ï▒Ï® Ïº┘äÏ»ÏºÏ┤Ï¿┘êÏ▒Ï»
      const headerContainer = document.querySelector('.headercontainer');
      const body = document.body;
      
      if (headerContainer) {
        headerContainer.style.display = 'block';
      }
      body.style.overflow = 'auto';
    };
  }, []);

  const [activeTab, setActiveTab] = useState("analytics");
  const [activeCategory, setActiveCategory] = useState(null); 
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
    const [Banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: "",
    order: 1,
    inStock: true,
  });
  const [searchQuery, setSearchQuery] = useState(""); // ­ƒöì search state
  const [stockFilter, setStockFilter] = useState("all");
const [subdomains, setSubdomains] = useState([]);
const [newSubdomain, setNewSubdomain] = useState(""); // for adding new subdomains
const [showCartModal, setShowCartModal] = useState(false);
const [cartContent, setCartContent] = useState(null);
const [cartOwnerName, setCartOwnerName] = useState("");

  const loadData = useCallback(async () => {
    const productsSnap = await getDocs(collection(db, "Products"));
    const catsSnap = await getDocs(collection(db, "categories"));
    const usersSnap = await getDocs(collection(db, "Users"));
const bannerssnap = await getDocs(collection(db,"Banners"));
    setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setBanners(bannerssnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setCategories(catsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time listener for Orders - updates automatically
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "Orders"),
        (snapshot) => {
          const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          console.log("✅ Orders loaded:", ordersData.length, "orders");
          setOrders(ordersData);
        },
        (error) => {
          console.error("❌ Error fetching orders:", error.message);
          // If there's a permission error, try to load without real-time
          if (error.code === 'permission-denied') {
            console.warn("Permission denied for Orders. Check Firestore rules.");
            // Fallback to getDocs
            getDocs(collection(db, "Orders"))
              .then((snapshot) => {
                const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setOrders(ordersData);
              })
              .catch(err => console.error("Fallback also failed:", err));
          }
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up orders listener:", error);
    }
  }, []);

  // ­ƒû╝ Compress image to ~350KB and convert to Base64
  const compressImage = (file, maxSizeKB = 350) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let width = img.width;
          let height = img.height;
          const maxWidth = 1000;
          const maxHeight = 1000;

          if (width > height && width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let base64 = canvas.toDataURL("image/jpeg", quality);

          while (base64.length / 1024 > maxSizeKB && quality > 0.2) {
            quality -= 0.05;
            base64 = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(base64);
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // ­ƒû╝ Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setNewProduct((prev) => ({ ...prev, image: compressed }));
  };

  // ­ƒôª Add or Edit Product
  const handleAddOrEditProduct = async (e) => {
    e.preventDefault();

    if (!newProduct.name ) {
      alert("Please fill name");
      return;
    }


if(newProduct.category === 'Frames'){
 if ( !newProduct.smallframeprice ) {
      alert("Please fill 20*30 price");
      return;
    }
     if ( !newProduct.bigframeprice ) {
      alert("Please fill 30*40 price");
      return;
    }
     if ( !newProduct.subdomain ) {
      alert("Please fill sub Category");
      return;
    }

}

else if(newProduct.category !== 'Frames'){
     if (!newProduct.price ) {
      alert("Please fill price");
      return;
    }
}



 if (!newProduct.category) {
      alert("Please fill category");
      return;
    }
const productwithsearchwords = {
  ...newProduct,
  searchwords: tags,
  order: Math.max(1, Number(newProduct.order) || 1),
  inStock: newProduct.inStock !== false,
  price: newProduct.category !== "Frames" ? Number(newProduct.price) : null,
  smallframeprice: newProduct.category === "Frames" ? Number(newProduct.smallframeprice) : null,
  bigframeprice: newProduct.category === "Frames" ? Number(newProduct.bigframeprice) : null,
};

    if (editingProduct) {

    await   updateDoc(doc(db, "Products", editingProduct.id), productwithsearchwords);
      
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...productwithsearchwords, id: editingProduct.id } : p
        )
      );
      setEditingProduct(null);

 
    
    } else {

      const docRef = await addDoc(collection(db, "Products"), productwithsearchwords);
      setProducts((prev) => [...prev, { ...productwithsearchwords, id: docRef.id }]);



    }

    setNewProduct({ name: "", price: "", category: "", description: "", image: "", order: 1, inStock: true });
    setShowModal(false);
  };

  // ­ƒùæ Remove Product
  const handleRemoveProduct = async (id) => {
    if (!window.confirm("Remove this product?")) return;
    await deleteDoc(doc(db, "Products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Ô£Å´©Å Edit Product
  const handleEditProduct = (product) => {
    setTags(product.searchwords ? product.searchwords : [] )
    setEditingProduct(product);
    setNewProduct(product);
    setShowModal(true);
  };
// ­ƒû╝ Compress banner image (auto-resize any size)
const compressBannerImage = (file, maxSizeKB = 350) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Ô£à Resize logic
        let width = img.width;
        let height = img.height;
        const maxWidth = 1920; // change this if you want smaller/larger
        const maxHeight = 1080;

        if (width > height && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Ô£à Compress until under limit
        let quality = 0.9;
        let base64 = canvas.toDataURL("image/jpeg", quality);
        while (base64.length / 1024 > maxSizeKB && quality > 0.3) {
          quality -= 0.05;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(base64);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

// ­ƒû╝ Handle banner image upload
const [newBanner, setNewBanner] = useState({ img: "", name: "" });
const [editingBanner, setEditingBanner] = useState(null);
const [showBannerModal, setShowBannerModal] = useState(false);

const handleBannerImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;


  const base64 = await compressBannerImage(file, 50);
  setNewBanner((prev) => ({ ...prev, img: base64 }));
};

// Ô×ò Add / Edit Banner
const handleAddOrEditBanner = async (e) => {
  e.preventDefault();

  if (!newBanner.img) {
    alert("Please upload a banner image.");
    return;
  }

  // build payload safely (only required + existing optional fields)
  const payload = {
    img: newBanner.img,
    name: newBanner.name,
    ...(newBanner.title?.trim() && { title: newBanner.title }),
    ...(newBanner.link?.trim() && { link: newBanner.link }),
  };

  if (editingBanner) {
    await updateDoc(doc(db, "Banners", editingBanner.id), payload);

    setBanners((prev) =>
      prev.map((b) =>
        b.id === editingBanner.id ? { ...b, ...payload } : b
      )
    );

    setEditingBanner(null);
  } else {
    const docRef = await addDoc(collection(db, "Banners"), payload);

    setBanners((prev) => [
      ...prev,
      { id: docRef.id, ...payload }
    ]);
  }

  setNewBanner({ img: "", name: "", title: "", link: "" });
  setShowBannerModal(false);
};

// ­ƒùæ Remove Banner
const handleRemoveBanner = async (id) => {
  if (!window.confirm("Remove this banner?")) return;
  await deleteDoc(doc(db, "Banners", id));
  setBanners((prev) => prev.filter((b) => b.id !== id));
};

// Ô£Å´©Å Edit Banner
const handleEditBanner = (banner) => {
  setEditingBanner(banner);
  setNewBanner(banner);
  setShowBannerModal(true);
};

  // Ô×ò Add Category
  const handleAddCategory = async () => {
    const name = prompt("Enter new category name:");
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = categories.some(
      (c) => c.Category?.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("Category already exists.");
      return;
    }
    const docRef = await addDoc(collection(db, "categories"), { Category: trimmed });
    setCategories((prev) => [...prev, { id: docRef.id, Category: trimmed }]);
  };

  // Ô£Å´©Å Edit Category (update in all products)
  const handleEditCategory = async (c) => {
    const newName = prompt("Edit category name:", c.Category);
    if (!newName) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    await updateDoc(doc(db, "categories", c.id), { Category: trimmed });
    setCategories((prev) =>
      prev.map((cat) => (cat.id === c.id ? { ...cat, Category: trimmed } : cat))
    );

    const productsSnap = await getDocs(collection(db, "Products"));
    const productsToUpdate = productsSnap.docs.filter(
      (d) => d.data().category === c.Category
    );
    const updatePromises = productsToUpdate.map((p) =>
      updateDoc(doc(db, "Products", p.id), { category: trimmed })
    );
    await Promise.all(updatePromises);

    setProducts((prev) =>
      prev.map((p) => (p.category === c.Category ? { ...p, category: trimmed } : p))
    );
  };

  // ­ƒùæ Remove Category (sets category=null in products)
  const handleRemoveCategory = async (c) => {
    if (!window.confirm(`Remove category "${c.Category}"?`)) return;
    await deleteDoc(doc(db, "categories", c.id));
    setCategories((prev) => prev.filter((cat) => cat.id !== c.id));

    const productsSnap = await getDocs(collection(db, "Products"));
    const productsToUpdate = productsSnap.docs.filter(
      (d) => d.data().category === c.Category
    );
    const updatePromises = productsToUpdate.map((p) =>
      updateDoc(doc(db, "Products", p.id), { category: null })
    );
    await Promise.all(updatePromises);

    setProducts((prev) =>
      prev.map((p) => (p.category === c.Category ? { ...p, category: null } : p))
    );
  };

  // ­ƒöì Filter products by name, category, and sort by order
  const filteredProducts = products
    .filter((p) => {
      const matchesName = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === null || p.category === activeCategory;
      const isInStock = p.inStock !== false;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && isInStock) ||
        (stockFilter === "out" && !isInStock);
      return matchesName && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      const orderA = Number(a.order) || 0;
      const orderB = Number(b.order) || 0;
      
      if ((orderA >= 1) !== (orderB >= 1)) {
        return (orderB >= 1) - (orderA >= 1);
      }
      
      return orderA - orderB;
    });

useEffect(() => {
  const loadSubdomains = async () => {
    const snap = await getDocs(collection(db, "Products"));
    const all = [];
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.category === "Frames" && data.subdomain) {
        all.push(data.subdomain);
      }
    });
    const unique = [...new Set(all)];
    setSubdomains(unique);
  };


  loadSubdomains();
}, []);




  const [input, setInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      setTags([...tags, input.trim()]);
      setInput("");
    }
  };
useEffect(() => {
  console.log(newProduct);
  
}, [newProduct]);

useEffect(() => {
  console.log(tags);
  
}, [tags]);

const removesearchword = (word) => {
  setTags(tags.filter(item => item !== word))
}

// ===== ANALYTICS FUNCTIONS =====
const getAnalytics = () => {
  // ÏºÏ│Ï¬Ï½┘åÏºÏí Ïº┘äÏú┘êÏº┘àÏ▒ Ïº┘ä┘à┘Å┘äÏ║ÏºÏ® ┘à┘å Ïº┘äÏ¬Ï¡┘ä┘è┘äÏºÏ¬ Ïº┘ä┘àÏº┘ä┘èÏ®
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  
  const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = activeOrders.length;
  const completedOrders = activeOrders.filter(o => o.status === 'delivered').length;
  const totalUsers = users.length;
  const totalProducts = products.length;

  // Top selling products
  const productSales = {};
  activeOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Orders by status
  const ordersByStatus = {
    processing: orders.filter(o => o.status === 'processing').length,
    waiting_for_whatsapp: orders.filter(o => o.status === 'waiting_for_whatsapp').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  return {
    totalRevenue,
    totalOrders,
    completedOrders,
    totalUsers,
    totalProducts,
    topProducts,
    ordersByStatus
  };
};

const handleEditOrder = (order) => {
  setEditingOrder({
    ...order,
    paymentStatus: order?.paymentStatus || "pending",
  });
  setShowOrderModal(true);
};

const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus) => {
  try {
    await updateDoc(doc(db, "Orders", orderId), {
      status: newStatus,
      paymentStatus: newPaymentStatus,
    });
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: newStatus, paymentStatus: newPaymentStatus }
          : o
      )
    );
    setEditingOrder(null);
    setShowOrderModal(false);
    alert("Order status updated successfully!");
  } catch (error) {
    console.error("Error updating order:", error);
    alert("Failed to update order");
  }
};

  return (
<div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div className="bg-dark text-white p-3 " style={{minHeight:"100vh",minWidth:"230px"}}>
        <h4>Dashboard</h4>

        <h5 className="my-4">HI, MR Ghtwry</h5>
        <ul className="nav flex-column mt-4">
          {["analytics", "products", "users", "orders", "categories", "banners"].map((tab) => (
            <li className="nav-item" key={tab}>
              <button
                className={`btn w-100 text-start mb-2 ${
                  activeTab === tab ? "btn-primary" : "btn-outline-light"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab !== "products") {
                    setActiveCategory(null);
                  }
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>

        {/* Product Categories Submenu */}
        {activeTab === "products" && categories.length > 0 && (
          <div className="mt-4 pt-4 border-top">
            <h6 className="text-light mb-2">Categories</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button
                  className={`btn btn-sm w-100 text-start mb-2 ${
                    activeCategory === null ? "btn-light text-dark" : "btn-outline-light"
                  }`}
                  onClick={() => setActiveCategory(null)}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li className="nav-item" key={cat.id}>
                  <button
                    className={`btn btn-sm w-100 text-start mb-2 ${
                      activeCategory === cat.Category ? "btn-light text-dark" : "btn-outline-light"
                    }`}
                    onClick={() => setActiveCategory(cat.Category)}
                  >
                    {cat.Category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 flex-grow-1">
        <style>{`
          .animate-card{ animation: fadeInUp .35s ease both; }
          @keyframes fadeInUp{ from{ opacity:0; transform: translateY(8px);} to{ opacity:1; transform: translateY(0);} }
          .tag{ background:#f1f1f1; padding:6px 10px; border-radius:16px; display:inline-flex; align-items:center; }
          .tag .btn-close{ margin-left:8px; }
          .extra-field-badge{ background:#f8f9fa; border:1px solid #e9ecef; padding:4px 8px; border-radius:12px; margin-right:6px; font-size:0.75rem; display:inline-block; margin-top:6px; }
        `}</style>
        <h2 className="mb-4 text-capitalize d-flex ">{activeTab} {activeTab === "banners" ? <p className=" text-muted m-0 d-flex align-items-center" style={{fontSize:'12px'}}>(Please Don't Upload or Delete any Banners)</p> : <></>}</h2>

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div>
            {(() => {
              const analytics = getAnalytics();
              return (
                <>
                  {/* Key Metrics */}
                  <div className="row mb-5">
                    <div className="col-md-3 mb-3">
                      <div className="card" style={{ borderTop: "4px solid #28a745" }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Total Revenue</h6>
                          <h3 className="m-0" style={{ color: "#28a745" }}>
                            {analytics.totalRevenue.toLocaleString()} EGP
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card" style={{ borderTop: "4px solid #0099ff" }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Total Orders</h6>
                          <h3 className="m-0" style={{ color: "#0099ff" }}>
                            {analytics.totalOrders}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card" style={{ borderTop: "4px solid #ffc107" }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Completed Orders</h6>
                          <h3 className="m-0" style={{ color: "#ffc107" }}>
                            {analytics.completedOrders}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card" style={{ borderTop: "4px solid #6f42c1" }}>
                        <div className="card-body">
                          <h6 className="text-muted mb-2">Total Users</h6>
                          <h3 className="m-0" style={{ color: "#6f42c1" }}>
                            {analytics.totalUsers}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="row mb-5">
                    <div className="col-md-6">
                      <div className="card p-4">
                        <h5 className="fw-bold mb-4">Orders by Status</h5>
                        <div className="table-responsive">
                          <table className="table table-sm">
                            <tbody>
                              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                                <tr key={status}>
                                  <td>
                                    <strong style={{ textTransform: "capitalize" }}>
                                      {status.replace(/_/g, " ")}
                                    </strong>
                                  </td>
                                  <td className="text-end">
                                    <span className="badge bg-secondary">{count}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card p-4">
                        <h5 className="fw-bold mb-4">Quick Stats</h5>
                        <div>
                          <p className="mb-3">
                            <strong>Total Products:</strong> <span className="badge bg-info">{analytics.totalProducts}</span>
                          </p>
                          <p className="mb-3">
                            <strong>Completion Rate:</strong>
                            <span className="badge bg-success ms-2">
                              {analytics.totalOrders > 0
                                ? Math.round((analytics.completedOrders / analytics.totalOrders) * 100)
                                : 0}%
                            </span>
                          </p>
                          <p className="mb-3">
                            <strong>Avg Order Value:</strong>
                            <span className="badge bg-primary ms-2">
                              {analytics.totalOrders > 0
                                ? Math.round(analytics.totalRevenue / analytics.totalOrders)
                                : 0} EGP
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="card p-4">
                    <h5 className="fw-bold mb-4">Top Selling Products</h5>
                    {analytics.topProducts.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Product Name</th>
                              <th>Quantity Sold</th>
                              <th>Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.topProducts.map((product, idx) => (
                              <tr key={idx}>
                                <td><strong>{product.name}</strong></td>
                                <td>{product.quantity}</td>
                                <td><strong style={{ color: "#28a745" }}>{product.revenue.toLocaleString()} EGP</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted">No sales data yet</p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <>
            <h3 className="mb-4">
              {activeCategory ? `${activeCategory} Products` : "All Products"}
            </h3>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button onClick={() => setShowModal(true)}>Add Product</Button>
              <div className="d-flex gap-2">
                <Form.Select
                  style={{ width: "180px" }}
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="all">All stock</option>
                  <option value="in">In stock</option>
                  <option value="out">Out of stock</option>
                </Form.Select>
                <Form.Control
                  type="text"
                  placeholder="Search by name..."
                  style={{ width: "300px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="row mt-3">
              {filteredProducts.length ? (
                filteredProducts.map((p) => (
                  <div className="col-md-4" key={p.id}>
                    <div className="card mb-3 shadow-sm animate-card">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="card-img-top"
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="">{p.name}</h5>
                        <p className="mb-1">{p.description}</p>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className={`badge ${p.inStock === false ? "bg-danger" : "bg-success"}`}>
                            {p.inStock === false ? "Out of stock" : "In stock"}
                          </span>
                          <Button
                            variant={p.inStock === false ? "outline-success" : "outline-danger"}
                            size="sm"
                            onClick={async () => {
                              const nextInStock = p.inStock === false;
                              try {
                                await updateDoc(doc(db, "Products", p.id), { inStock: nextInStock });
                                setProducts((prev) =>
                                  prev.map((prod) =>
                                    prod.id === p.id ? { ...prod, inStock: nextInStock } : prod
                                  )
                                );
                              } catch (error) {
                                console.error("Error updating stock status:", error);
                              }
                            }}
                          >
                            {p.inStock === false ? "Mark In Stock" : "Mark Out"}
                          </Button>
                        </div>
                        <p className=" mb-0 text-muted">
                          {p.category || <em>No category</em>}
                        </p>
                        {p.category === 'Frames' ?  <p className="text-muted ms-1">
                          - {p.subdomain || <em>No Sub Category</em>}
                        </p> : <></>}
                         {p.category === 'Frames' ? <p className="">EGP {p.smallframeprice}</p> :       
            <p className="">EGP {p.price}</p>
}
                        {/* Order Input */}
                        <div className="mb-2">
                          <label className="form-label mb-1" style={{fontSize: '0.85rem'}}>Order:</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={p.order || 0}
                            onChange={async (e) => {
                              const newOrder = Math.max(1, parseInt(e.target.value, 10) || 1);
                              try {
                                await updateDoc(doc(db, "Products", p.id), { order: newOrder });
                                setProducts((prev) =>
                                  prev.map((prod) =>
                                    prod.id === p.id ? { ...prod, order: newOrder } : prod
                                  )
                                );
                              } catch (error) {
                                console.error("Error updating order:", error);
                              }
                            }}
                            min={1}
                            placeholder="1"
                          />
                        </div>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditProduct(p)}
                        >
                          Edit
                        </Button>{" "}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveProduct(p.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No products found.</p>
              )}
            </div>
          </>
        )}

{activeTab === "banners" && (
  <>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <Button onClick={() => setShowBannerModal(true)}>Add Banner</Button>
    </div>

    <div className="row mt-3">
      {Banners.length ? (
        Banners.map((b) => (
          <div className="col-md-4" key={b.id}>
            <div className="card mb-3 shadow-sm animate-card">
              {b.img && (
                <img
                  src={b.img}
                  alt="Banner"
                  className="card-img-top"
                  style={{ height: "200px", objectFit: "cover" }}
                />
              )}
              <div className="card-body">
                <h5>{b.name || "Unnamed Banner"}</h5>
                {b.title? <h6 className="text-black">{b.title}</h6> : <h6 className="text-muted">-- Untitled Banner</h6>} 
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEditBanner(b)}
                >
                  Edit
                </Button>{" "}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveBanner(b.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>You didn't upload any banners yet.</p>
      )}
    </div>
  </>
)}
{/* USERS TAB */}
{activeTab === "users" && (
  <div>
    <h5 className="mb-4">User Management</h5>
    {users.length ? (
      <div className="table-responsive">
        <table className="table table-bordered align-middle table-hover">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Business</th>
              <th>Email / User</th>
              <th>Phone</th>
              <th>City</th>
              <th>Address</th>
              <th>Sign-up Method</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.fullName || u.Name || "Not Set"}</strong>
                </td>
                <td>
                  {/* Business name shown in blue if available */}
                  {getBusinessName(u) ? (
                    <span style={{ color: "#0066cc", fontWeight: 600 }}>{getBusinessName(u)}</span>
                  ) : (
                    <em className="text-muted">--</em>
                  )}
                </td>
                <td>{u.User}</td>
                <td>{u.phone || "---"}</td>
                <td>{u.city || "---"}</td>
                <td>
                  <small>{sanitizeDisplayValue('address', u.address)}</small>
                  {/* render any additional fields the user may have added (masked/truncated) */}
                  <div>
                    {getExtraFields(u).map(({ k, v, label, title }) => (
                      k === 'cart' ? (
                        <button key={k} className="extra-field-badge btn btn-sm" title={typeof title === 'string' ? title : ''} onClick={() => openCartModalForUser(u)}>
                          {k}: {label}
                        </button>
                      ) : (
                        <span key={k} className="extra-field-badge" title={typeof title === 'string' ? title : ''}>{k}: {label}</span>
                      )
                    ))}
                  </div>
                </td>
                <td>
                  <span className="badge bg-info">{u.Method || "Manual"}</span>
                </td>

                {/* ADMIN STATUS */}
                <td>
                  <span className={`badge ${u.Admin ? "bg-success" : "bg-secondary"}`}>
                    {u.Admin ? "Yes" : "No"}
                  </span>
                </td>

                {/* ACTION BUTTONS */}
                <td className="d-flex gap-2">

                  {/* TOGGLE ADMIN */}
                  <button
                    className={`btn btn-sm ${u.Admin ? "btn-danger" : "btn-success"}`}
                    onClick={async () => {
                      const newAdmin = !u.Admin;

                      await updateDoc(doc(db, "Users", u.id), {
                        Admin: newAdmin,
                      });

                      setUsers((prev) =>
                        prev.map((user) =>
                          user.id === u.id ? { ...user, Admin: newAdmin } : user
                        )
                      );
                    }}
                    title={u.Admin ? "Revoke Admin" : "Make Admin"}
                  >
                    {u.Admin ? "Revoke Admin" : "Make Admin"}
                  </button>

                  {/* DELETE USER */}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this user?")) {
                        await deleteDoc(doc(db, "Users", u.id));

                        setUsers((prev) => prev.filter((x) => x.id !== u.id));
                      }
                    }}
                    title="Delete User"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-muted">No users found</p>
    )}
  </div>
)}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <div className="mb-3 d-flex gap-2 align-items-center">
              <Button 
                variant="secondary" 
                onClick={() => {
                  console.log("🔄 Refreshing orders...");
                  getDocs(collection(db, "Orders"))
                    .then((snapshot) => {
                      const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                      console.log("✅ Orders refreshed:", ordersData.length);
                      setOrders(ordersData);
                      alert(`✅ ${ordersData.length} orders loaded`);
                    })
                    .catch(err => {
                      console.error("❌ Refresh failed:", err);
                      alert("❌ Failed to refresh orders");
                    });
                }}
              >
                🔄 Refresh Orders
              </Button>
              <small className="text-muted">Total: {orders.length} orders | Processing: {orders.filter(o => o.status === 'processing').length} | Shipped: {orders.filter(o => o.status === 'shipped').length} | Delivered: {orders.filter(o => o.status === 'delivered').length}</small>
            </div>
            {orders.length ? (
              <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="table table-hover table-striped">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th style={{minWidth: '130px'}}>Order ID</th>
                      <th style={{minWidth: '180px'}}>Customer</th>
                      <th style={{minWidth: '200px'}}>Items</th>
                      <th style={{minWidth: '100px'}}>Total</th>
                      <th style={{minWidth: '100px'}}>Payment</th>
                      <th style={{minWidth: '140px'}}>Status</th>
                      <th style={{minWidth: '100px'}}>Date</th>
                      <th style={{minWidth: '150px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.sort((a, b) => {
                      const timeA = a.timestamp?.toMillis?.() || a.timestamp || 0;
                      const timeB = b.timestamp?.toMillis?.() || b.timestamp || 0;
                      return timeB - timeA; // Newest first
                    }).map((o) => (
                      <tr key={o.id} style={{verticalAlign: 'middle'}}>
                        <td><strong style={{color: '#0066cc'}}>{o.orderId}</strong></td>
                        <td>
                          <div>
                            <p className="m-0 fw-bold">{o.customer?.fullName || 'N/A'}</p>
                            <small className="text-muted">{o.customer?.phone || 'N/A'}</small>
                          </div>
                        </td>
                        <td>
                          <small>
                            <strong>{o.items?.length || 0} item(s)</strong>
                            {o.items && o.items.length > 0 && (
                              <div style={{fontSize: '0.8rem', marginTop: '5px', maxHeight: '80px', overflowY: 'auto'}}>
                                {o.items.map((item, idx) => (
                                  <div key={idx} style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                    • {item.name} x {item.quantity}
                                  </div>
                                ))}
                              </div>
                            )}
                          </small>
                        </td>
                        <td><strong style={{color: '#28a745', fontSize: '1.1em'}}>{o.total} EGP</strong></td>
                        <td>
                          <span className="badge bg-info" style={{padding: '6px 10px'}}>
                            {o.paymentMethod?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${  
                            o.status === 'processing' ? 'bg-warning text-dark' :
                            o.status === 'delivered' ? 'bg-success' :
                            o.status === 'waiting_for_whatsapp' ? 'bg-info' :
                            o.status === 'cancelled' ? 'bg-danger' :
                            'bg-secondary'
                          }`} style={{padding: '6px 10px'}}>
                            {o.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td>
                          <small>
                            {o.timestamp
                              ? new Date(o.timestamp.toMillis?.() || o.timestamp).toLocaleDateString('en-US')
                              : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditOrder(o)}
                              style={{fontSize: '0.85rem', padding: '4px 8px'}}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                const message = buildOrderConfirmationMessage(o, o.paymentMethod || 'cod');
                                sendWhatsAppToCustomer(o.customer?.phone || '', message);
                              }}
                              style={{fontSize: '0.85rem', padding: '4px 8px'}}
                              title="Send WhatsApp to customer"
                            >
                              📱 WhatsApp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">­ƒôª No orders found</div>
            )}
          </div>
        )}

        {/* EDIT ORDER MODAL */}
        {editingOrder && (
          <Modal show={showOrderModal} onHide={() => {setShowOrderModal(false); setEditingOrder(null);}} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Order Status</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <p><strong>Order ID:</strong> {editingOrder.orderId}</p>
                <p><strong>Customer:</strong> {editingOrder.customer?.fullName}</p>
                <p><strong>Payment Method:</strong> {(editingOrder.paymentMethod || "N/A").toUpperCase()}</p>
                <p><strong>Current Status:</strong> <span className="badge bg-secondary">{editingOrder.status}</span></p>
              </div>
              <Form.Group>
                <Form.Label className="fw-bold">Update Status:</Form.Label>
                <Form.Select 
                  defaultValue={editingOrder.status}
                  onChange={(e) => {
                    setEditingOrder({...editingOrder, status: e.target.value});
                  }}
                >
                  <option value="processing">Processing</option>
                  <option value="waiting_for_whatsapp">Waiting for WhatsApp</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label className="fw-bold">Payment Status:</Form.Label>
                <Form.Select
                  value={editingOrder.paymentStatus || "pending"}
                  onChange={(e) => {
                    setEditingOrder({ ...editingOrder, paymentStatus: e.target.value });
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label className="fw-bold">WhatsApp Message Text:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={8}
                  readOnly
                  value={buildOrderConfirmationMessage(
                    editingOrder,
                    editingOrder.paymentMethod || "cod"
                  )}
                />
              </Form.Group>

              <div className="mt-2 d-flex justify-content-end">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        buildOrderConfirmationMessage(
                          editingOrder,
                          editingOrder.paymentMethod || "cod"
                        )
                      );
                      alert("Message copied to clipboard");
                    } catch (error) {
                      console.error("Failed to copy message:", error);
                      alert("Failed to copy message");
                    }
                  }}
                >
                  Copy Message
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => {setShowOrderModal(false); setEditingOrder(null);}}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  handleUpdateOrderStatus(
                    editingOrder.id,
                    editingOrder.status,
                    editingOrder.paymentStatus || "pending"
                  )
                }
              >
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        )}




        {activeTab === "categories" && (
  <>
    <Button onClick={handleAddCategory}>Add Category</Button>

    <ul className="list-group mt-3">
      {categories.length ? (
        categories.map((c) => {

          return (
            <li key={c.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{c.Category}</strong>

                <div>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleEditCategory(c)}
                  >
                    Edit
                  </Button>{" "}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveCategory(c)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* SUBDOMAINS SECTION */}
              {c.Category === "Frames" && (
                <div className="mt-2 ms-3">
                  {subdomains.length ? (
                    <ul className="list-group">
                      {subdomains.map((sd) => (
                        <li
                          key={sd}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {sd}

                          <div>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleEditCategory(sd)}
                            >
                              Edit
                            </Button>{" "}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveCategory(sd)}
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <em className="text-muted">No subdomains found.</em>
                  )}
                </div>
              )}
            </li>
          );
        })
      ) : (
        <p>No categories found.</p>
      )}
    </ul>
  </>
)}

      


      </div>

      {/* Add/Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddOrEditProduct}>
            <Form.Group className="mb-3">
              <Form.Label>Image</Form.Label>
              <Form.Control type="file" onChange={handleImageUpload} />
              {newProduct.image && (
                <img
                  src={newProduct.image}
                  alt="Preview"
                  style={{ width: "100%", marginTop: "10px" }}
                />
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </Form.Group>
                     <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={newProduct.category || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, category: e.target.value }))
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.Category}>
                    {c.Category}
                  </option>
                ))}
              </Form.Select>
              {/* Conditional selects for "frames" */}
{/* {newProduct.category === "Frames" && (
  
)} */}

            </Form.Group>
            {newProduct.category === "Frames" ?  <>
    {/* Size select */}
 <Form.Group className="mb-3">
              <Form.Label>20*30 Price</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.smallframeprice}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, smallframeprice: e.target.value }))
                }
              />
            </Form.Group>

             <Form.Group className="mb-3">
              <Form.Label>30*40 Price</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.bigframeprice}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, bigframeprice: e.target.value }))
                }
              />
            </Form.Group>

    <Form.Group className="mb-3">
      <Form.Label>Sub Category</Form.Label>
      <div className="d-flex gap-2">
        <Form.Select
          value={newProduct.subdomain || ""}
          onChange={(e) =>
            setNewProduct((prev) => ({ ...prev, subdomain: e.target.value }))
          }
        >
          <option value="">Select sub Category</option>
          {subdomains.map((sd) => (
            <option key={sd} value={sd}>
              {sd}
            </option>
          ))}
        </Form.Select>
        <Form.Control
          type="text"
          placeholder="Add new sub Category"
          value={newSubdomain}
          onChange={(e) => setNewSubdomain(e.target.value)}
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (newSubdomain.trim() && !subdomains.includes(newSubdomain.trim())) {
              setSubdomains((prev) => [...prev, newSubdomain.trim()]);
              setNewProduct((prev) => ({ ...prev, subdomain: newSubdomain.trim() }));
              setNewSubdomain("");
            }
          }}
        >
          Add
        </Button>
      </div>
    </Form.Group>
    {/* Subdomain select */}

  </> :   <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </Form.Group>}


 <div className="tagscontainer">
          <p className="mb-2">Search Words</p>

      <input 
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter"
      />
      <div className="tags mb-3">
{tags && (
  <div className="d-flex gap-2 flex-wrap">

        {tags.map((sw, index) => (
      
      <div className=" tag" key={index}>{sw} 
      <button 
      onClick={()=>removesearchword(sw)}
      type="button" 
      class="btn-close" 
      aria-label="Close" /></div>
    ))}


  </div>
)}



      </div>

    </div>
 
     
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Stock Status</Form.Label>
              <Form.Select
                value={newProduct.inStock === false ? "out" : "in"}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    inStock: e.target.value === "in",
                  }))
                }
              >
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit">
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showBannerModal} onHide={() => setShowBannerModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>{editingBanner ? "Edit Banner" : "Add Banner"}</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form onSubmit={handleAddOrEditBanner}>
      <Form.Group className="mb-3">
        <Form.Label>Banner Name</Form.Label>
        <Form.Control
          type="text"
          value={newBanner.name}
          onChange={(e) =>
            setNewBanner((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter banner name (optional)"
        />
      </Form.Group>

            <Form.Group className="mb-3">
        <Form.Label>Banner Title</Form.Label>
        <Form.Control
          type="text"
          value={newBanner.title}
          onChange={(e) =>
            setNewBanner((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter banner Title (optional)"
        />
      </Form.Group>
        <Form.Group className="mb-3">
        <Form.Label>Link</Form.Label>
        <Form.Control
          type="text"
          value={newBanner.link}
          onChange={(e) =>
            setNewBanner((prev) => ({ ...prev, link: e.target.value }))
          }
          placeholder="Enter Link (optional)"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Banner Image</Form.Label>
        <Form.Control type="file" accept="image/*" onChange={handleBannerImageUpload} />
        {newBanner.img && (
          <img
            src={newBanner.img}
            alt="Preview"
            style={{ width: "100%", marginTop: "10px", borderRadius: "10px" }}
          />
        )}
      </Form.Group>
      <Button type="submit">
        {editingBanner ? "Save Changes" : "Add Banner"}
      </Button>
    </Form>
  </Modal.Body>
</Modal>

      {/* CART DETAILS MODAL (for user carts) */}
      <Modal show={showCartModal} onHide={() => { setShowCartModal(false); setCartContent(null); }} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Cart: {cartOwnerName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cartContent ? (
            cartContent.items ? (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const displayItems = normalizeCartItems(cartContent.items);
                      return displayItems.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{width: '80px'}}>{it.image ? <img src={it.image} style={{height: '48px', objectFit: 'cover'}} alt={it.name} /> : <span className="text-muted">ÔÇö</span>}</td>
                          <td style={{verticalAlign: 'middle'}}>{it.name}</td>
                          <td style={{verticalAlign: 'middle'}}>{it.quantity}</td>
                          <td style={{verticalAlign: 'middle'}}>{(it.price || 0)} EGP</td>
                          <td style={{verticalAlign: 'middle'}}>{((it.price || 0) * (it.quantity || 1)).toLocaleString()} EGP</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <p className="mb-2"><strong>Summary:</strong></p>
                <pre style={{whiteSpace: 'pre-wrap', maxHeight: '360px', overflow: 'auto'}}>{typeof cartContent.summary === 'object' ? JSON.stringify(cartContent.summary, null, 2) : String(cartContent.summary)}</pre>
              </div>
            )
          ) : (
            <p className="text-muted">No cart data available</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowCartModal(false); setCartContent(null); }}>Close</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

