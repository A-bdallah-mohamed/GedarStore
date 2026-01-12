import React, {useRef,useEffect} from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Link } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { auth } from "../firebase/firebaseconfig";
import { query, where, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";
import { doc, updateDoc, setDoc } from "firebase/firestore";

export default function Productslider({products,category}) {

  const sliderwrapper = useRef(null)
  const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")    
    .replace(/[^a-z0-9-]/g, ""); 


 const scrollswiper = (amount) => {
    sliderwrapper.current.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

const user = auth.currentUser
useEffect(()=> {
if (user) {
    console.log("logged in" + user.email);

} else {
  console.log("Not logged in");
}
},[user])

const addtocart = async (product, e) => {
    let productDiv = e.currentTarget; // start from button

  if (user) {

  // 🔹 Traverse up to find the product div

  // 🔹 Firestore logic
  const q = query(collection(db,"Users"), where("User" , "==" , user.email));
  const currentuser = await getDocs(q);
  if (currentuser.empty) return;

  const userDoc = currentuser.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;

  const newCart = userData.cart ? [...userData.cart, product.id] : [product.id];
  const userWithCart = { ...userData, cart: newCart };
  const userDocRef = doc(db, "Users", userId);
  await updateDoc(userDocRef, userWithCart);

  console.log("Product added:", product);

  }
else {
  let cartLS = localStorage.getItem('cart');
  let cart;

  if (!cartLS) {
    // If cart doesn't exist, create new array with this product
    cart = [product.id];
  } else {
    // Parse the existing cart string into an array
    cart = JSON.parse(cartLS);
    cart.push(product.id); // add new product
  }

  // Save back to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  console.log(localStorage.getItem('cart'));
}


  while (productDiv && !productDiv.classList.contains('product')) {
    productDiv = productDiv.parentElement;
  }



  // 🔹 Show the added message
  const addedDiv = productDiv.querySelector('.added');
  if (addedDiv) {
    addedDiv.classList.add('active');
    setTimeout(() => {
      addedDiv.classList.remove('active');
    }, 2000);
  }



};



    if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <div className=' slider  d-flex flex-column mt-3'>
      <div className='w-100 d-flex justify-content-between px-4  maxw ' >
      <h1>{category}</h1>
      <div className='d-flex align-items-center gap-3'>
        <div className='d-flex align-items-center gap-2'>
          <button className='pagination'  onClick={()=>scrollswiper(-1000)}><IoIosArrowBack /></button>      
          <button className='pagination' onClick={()=>scrollswiper(1000)}><IoIosArrowForward /></button>

        </div>
      <button className='m-0  border-0 bg-transparent'>View all</button>
      </div>
      </div>
        <div className='Productslider maxw ' ref={sliderwrapper}>

{products.length > 0 ? (
  products.map((product,index) => (

  <div className='product gap-3' key={product.id}>
      
      <div className='added'>
        item Added To Cart Successfully
      </div>
      <div className="imgcontainer">
        <Link to={`/products/${slugify(product.name)}`} className='navlink'>
        <img src={product.image} alt="" /></Link>
        <button className='addtocarthvrbtn' onClick={(e)=> addtocart(product,e)}>+ Add to Cart</button>
                <button className='addtowshlsthvrbtn' onClick={()=> console.log('add to Wishlist')}><FaRegHeart /> Add to Wishlist</button>

      </div>
      <div className='w-100'>
          <Link to={`/products/${slugify(product.name)}`} className='navlink'>
      <h5>{product.name}</h5></Link>
      <p className=' '>{product.smallframeprice ? <p className='p-0'>From LE {product.smallframeprice}.00</p> : <> {product.price}.00 LE</>} </p>
      </div>
      </div>
  ))
) : (
  <p>Loading...</p>
)}

</div>
    </div>
  )
}
