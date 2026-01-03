import React,{useState,useEffect,createContext, useContext} from "react";
import { Routes, Route, Link } from "react-router-dom";
import ProductPage from "./pages/ProductPage";
import Dashboard from "./pages/Dashboard";
import Mainpage from "./pages/Mainpage";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import { db } from "./firebase/firebaseconfig";
import ScrollToTop from "./GlobalStates/ScrollToTop";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import Cart from './pages/Cart'

const productsglobalcontext = createContext()
export const useGlobal = () => useContext(productsglobalcontext)

function App() {
  const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")    
    .replace(/[^a-z0-9-]/g, ""); 

const [loading, setLoading] = useState(true);
const [users,setusers] = useState([])

const [products,setproducts] = useState([])
const [banners,setbanners] = useState([])
const loadData = async () => {
  const [productsSnap, bannersSnap] = await Promise.all([
    getDocs(collection(db, "Products")),
    getDocs(collection(db, "Banners")),
  ]);

  setproducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  setbanners(bannersSnap.docs.map(d => ({ id: d.id, ...d.data() }))); 

  setLoading(false);  
};
const getusers = async () => {
  const usersnap = await getDocs(collection(db, "Users"));
  const usersArr = usersnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  setusers(usersArr);
  console.log("app js users", usersArr); 
};

useEffect(()=> {
loadData()
getusers()
},[])

useEffect(() => {
  if (loading) {
    document.body.style.overflow = "hidden";  
  } else {
    document.body.style.overflow = "auto";    
  }
}, [loading]);






  return (
<productsglobalcontext.Provider value={{ products, banners, users }}>
             <ScrollToTop />
      <Routes>
         <Route path="/" element={<Mainpage />} />
        <Route path="/Login" element={<Login />}  />
                <Route path="/Cart" element={<Cart />}  />

        <Route path="/Dashboard" element={
          <ProtectedRoute adminOnly={true}>
          <Dashboard />
          </ProtectedRoute>
          } />
{products.length > 0 &&
  products.map((product, index) => (
    <Route
      key={index}
      path={`/products/${slugify(product.name)}`} 
      element={<ProductPage product={product}/> }
    />
  ))
}

      </Routes>
</productsglobalcontext.Provider>
  );
}
export default App;
