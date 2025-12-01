import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseconfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Dashboard() {


  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
    const [Banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: "",
  });
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 search state
const [sizes, setSizes] = useState([]);
const [subdomains, setSubdomains] = useState([]);
const [newSubdomain, setNewSubdomain] = useState(""); // for adding new subdomains
const frameSizes = ["20*30", "30*40"]; // fixed sizes for frames

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const productsSnap = await getDocs(collection(db, "Products"));
    const catsSnap = await getDocs(collection(db, "categories"));
    const usersSnap = await getDocs(collection(db, "Users"));
    const ordersSnap = await getDocs(collection(db, "orders"));
const bannerssnap = await getDocs(collection(db,"Banners"));
    setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setBanners(bannerssnap.docs.map((d) => ({ id: d.id, ...d.data() })));
console.log(Banners)
    setCategories(catsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // 🖼 Compress image to ~350KB and convert to Base64
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

  // 🖼 Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setNewProduct((prev) => ({ ...prev, image: compressed }));
  };

  // 📦 Add or Edit Product
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

    if (editingProduct) {
      await updateDoc(doc(db, "Products", editingProduct.id), newProduct);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...newProduct, id: editingProduct.id } : p
        )
      );
      setEditingProduct(null);
    } else {
      const docRef = await addDoc(collection(db, "Products"), newProduct);
      setProducts((prev) => [...prev, { ...newProduct, id: docRef.id }]);
    }

    setNewProduct({ name: "", price: "", category: "", description: "", image: "" });
    setShowModal(false);
  };

  // 🗑 Remove Product
  const handleRemoveProduct = async (id) => {
    if (!window.confirm("Remove this product?")) return;
    await deleteDoc(doc(db, "Products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ✏️ Edit Product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setShowModal(true);
  };
// 🖼 Compress banner image (auto-resize any size)
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

        // ✅ Resize logic
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

        // ✅ Compress until under limit
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

// 🖼 Handle banner image upload
const [newBanner, setNewBanner] = useState({ img: "", name: "" });
const [editingBanner, setEditingBanner] = useState(null);
const [showBannerModal, setShowBannerModal] = useState(false);

const handleBannerImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;


  const base64 = await compressBannerImage(file, 50);
  setNewBanner((prev) => ({ ...prev, img: base64 }));
};

// ➕ Add / Edit Banner
const handleAddOrEditBanner = async (e) => {
  e.preventDefault();

  if (!newBanner.img) {
    alert("Please upload a banner image.");
    return;
  }

  if (editingBanner) {
    await updateDoc(doc(db, "Banners", editingBanner.id), { img: newBanner.img, name: newBanner.name });
    setBanners((prev) =>
      prev.map((b) =>
        b.id === editingBanner.id ? { ...b, img: newBanner.img, name: newBanner.name } : b
      )
    );
    setEditingBanner(null);
  } else {
    const docRef = await addDoc(collection(db, "Banners"), { img: newBanner.img, name: newBanner.name });
    setBanners((prev) => [...prev, { id: docRef.id, img: newBanner.img, name: newBanner.name }]);
  }

  setNewBanner({ img: "", name: "" });
  setShowBannerModal(false);
};

// 🗑 Remove Banner
const handleRemoveBanner = async (id) => {
  if (!window.confirm("Remove this banner?")) return;
  await deleteDoc(doc(db, "Banners", id));
  setBanners((prev) => prev.filter((b) => b.id !== id));
};

// ✏️ Edit Banner
const handleEditBanner = (banner) => {
  setEditingBanner(banner);
  setNewBanner(banner);
  setShowBannerModal(true);
};

  // ➕ Add Category
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

  // ✏️ Edit Category (update in all products)
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

  // 🗑 Remove Category (sets category=null in products)
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

  // 🔍 Filter products by name
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

useEffect(() => {
  const loadSubdomains = async () => {
    const snap = await getDocs(collection(db, "Products"));

    const all = [];

    snap.docs.forEach((doc) => {
      const data = doc.data();

      // only frame products have subdomains
      if (data.category === "Frames" && data.subdomain) {
        all.push(data.subdomain);
      }
    });

    // remove duplicates
    const unique = [...new Set(all)];

    setSubdomains(unique);
  };

  loadSubdomains();
}, []);

  return (
<div className="d-flex h-100">
      {/* Sidebar */}
      <div className="bg-dark text-white p-3 " style={{minHeight:"100vh",minWidth:"230px"}}>
        <h4>Dashboard</h4>

        <h5 className="my-4">HI, MR Ghtwry 🙌</h5>
        <ul className="nav flex-column mt-4">
          {["products", "users", "orders", "categories", "banners"].map((tab) => (
            <li className="nav-item" key={tab}>
              <button
                className={`btn w-100 text-start mb-2 ${
                  activeTab === tab ? "btn-primary" : "btn-outline-light"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="p-4 flex-grow-1">
        <h2 className="mb-4 text-capitalize">{activeTab}</h2>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button onClick={() => setShowModal(true)}>Add Product</Button>
              <Form.Control
                type="text"
                placeholder="Search by name..."
                style={{ width: "300px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="row mt-3">
              {filteredProducts.length ? (
                filteredProducts.map((p) => (
                  <div className="col-md-4" key={p.id}>
                    <div className="card mb-3 shadow-sm">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="card-img-top"
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      )}
                      <div className="card-body">
                        <h5 className="fw-bold">{p.name}</h5>
                        <p className="mb-1">{p.description}</p>
                        <p className=" mb-0 text-muted">
                          {p.category || <em>No category</em>}
                        </p>
                        {p.category === 'Frames' ?  <p className="text-muted ms-1">
                          - {p.subdomain || <em>No Sub Category</em>}
                        </p> : <></>}
                         {p.category === 'Frames' ? <p className="fw-bold">EGP {p.smallframeprice}</p> :       
            <p className="fw-bold">EGP {p.price}</p>
}
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
            <div className="card mb-3 shadow-sm">
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
    {users.length ? (
      <table className="table table-bordered align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email / User</th>
            <th>Method</th>
            <th>Password</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.Name || "Unnamed"}</td>
              <td>{u.User}</td>
              <td>{u.Method}</td>

              {/* PASSWORD ALWAYS VISIBLE, show ---- if null */}
              <td>{u.Pasword ? u.Pasword : "----"}</td>

              {/* ADMIN STATUS */}
              <td>{u.Admin ? "Yes" : "No"}</td>

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
                >
                  {u.Admin ? "Revoke Admin" : "Make Admin"}
                </button>

                {/* DELETE USER */}
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async () => {
                    if (window.confirm("Delete this user?")) {
                      await deleteDoc(doc(db, "Users", u.id));

                      setUsers((prev) => prev.filter((x) => x.id !== u.id));
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>No users found.</p>
    )}
  </div>
)}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            {orders.length ? (
              <ul className="list-group">
                {orders.map((o) => (
                  <li key={o.id} className="list-group-item">
                    Order #{o.id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No orders found.</p>
            )}
          </div>
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
            {newProduct.category === "Frames" ?  <></> :   <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, price: e.target.value }))
                }
              />
            </Form.Group>}
           
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
{newProduct.category === "Frames" && (
  <>
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

  </>
)}

            </Form.Group>
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

    </div>
  );
}

