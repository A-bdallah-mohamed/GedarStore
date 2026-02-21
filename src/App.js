import React,{useState,useEffect,createContext, useContext} from "react";
import { Routes, Route } from "react-router-dom";
import ProductPage from "./pages/ProductPage";
import Dashboard from "./pages/Dashboard";
import Mainpage from "./pages/Mainpage";
import Login from "./pages/Login";
import CategoryPage from "./pages/CategoryPage";
import CustomCategory from "./pages/CustomCategory";
import ProtectedRoute from "./ProtectedRoute";
import { db } from "./firebase/firebaseconfig";
import ScrollToTop from "./GlobalStates/ScrollToTop";
import Profile from "./pages/Profile";
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
import Checkout from "./pages/Checkout";
import logo from './Assets/logo.png'
import Wishlist from "./pages/wishlist";
const productsglobalcontext = createContext()
export const useGlobal = () => useContext(productsglobalcontext)

function App() {
const slugify = (str = "") =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const sortByOrder = (arr = []) =>
  [...arr].sort((a, b) => {
    const orderA = Number(a?.order) || 0;
    const orderB = Number(b?.order) || 0;

    if ((orderA >= 1) !== (orderB >= 1)) {
      return (orderB >= 1) - (orderA >= 1);
    }

    return orderA - orderB;
  });

    
const [loading, setLoading] = useState(true);
const [users,setusers] = useState([])

const [products,setproducts] = useState([])
const [banners,setbanners] = useState([])
const loadData = async () => {
  const [productsSnap, bannersSnap] = await Promise.all([
    getDocs(collection(db, "Products")),
    getDocs(collection(db, "Banners")),
  ]);

  setproducts(sortByOrder(productsSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
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


const [categories, setcategories] = useState([]);

const getcategories = async () => {
  const snap = await getDocs(collection(db, "categories"));
  const arr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(categories);

  setcategories(arr);
    console.log(categories);

};



  return (
<productsglobalcontext.Provider value={{ products, banners, users, categories }}>
               <ScrollToTop />
                 <div className={`startinganimation ${products.length > 0 ? '' : 'active'}`}>
                <div className={`imgcontainer ${products.length > 0 ? '' : 'active'}`}>
        <img src={logo} alt="" />
                </div>
                
              </div>
      <Routes>
          
        
         <Route path="/" element={<Mainpage />} />
        <Route path="/Login" element={<Login />}  />
                <Route path="/Cart" element={<Cart />}  />
                <Route path="/Checkout" element={<Checkout />}  />
        <Route path="/category" element={<CategoryPage />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
                <Route path="/custom" element={<CustomCategory />} />
                <Route path="/Profile" element={<Profile />} />
  {/* new routes */}
  {/* <Route path="/custom-sticker" element={<CustomSticker />} /> */}
  {/* <Route path="/custom-frame" element={<CustomFrame />} /> */}
  {/* <Route path="/checkout" element={<Checkout />} /> */}
  <Route path="/wishlist" element={<Wishlist />} />

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
