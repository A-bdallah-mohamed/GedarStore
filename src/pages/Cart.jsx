import React,{useState,useEffect} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import logo from '../Assets/logo.png'
import { FaChevronDown } from "react-icons/fa";
import { useGlobal } from '../App';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
import { auth } from "../firebase/firebaseconfig";
import { query, where, getDocs, collection } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { Link } from 'react-router-dom';


export default function Cart() {


  const { products } = useGlobal();


const user = auth.currentUser

 const [cartitems, setcartitems] = useState([]);
 const [totalorder, settotalorder] = useState();
 const [totalorderpercent, settotalorderpercent] = useState([]);

  useEffect(() => {
 const fetchCart = async () => {
  if (!products || products.length === 0) return;

  let cartData = [];

  if (user) {
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      if (userDoc) {
        const userData = userDoc.data() || {};
        const cartArray = Array.isArray(userData.cart) ? userData.cart : [];

        const countMap = cartArray.reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {});

        cartData = products
          .map(p => ({ ...p, quantity: countMap[p.id] || 0 }))
          .filter(p => p.quantity > 0);
      }
    }
  } else {
    // guest cart
    let items = [];
    try {
      const raw = localStorage.getItem('cart');
      items = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch {
      items = [];
    }

    const countMap = items.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    cartData = products
      .map(p => ({ ...p, quantity: countMap[p.id] || 0 }))
      .filter(p => p.quantity > 0);
  }

  setcartitems(cartData);
};

    fetchCart();
  }, [user, db, products]);
  
useEffect(()=> {
        console.log("Carttttt:", cartitems , totalorderpercent);

},[cartitems,totalorderpercent])


const syncCartToFirebase = async (updatedCart) => {
  if (!user) return;

  const q = query(collection(db, "Users"), where("User", "==", user.email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const userDoc = snapshot.docs[0];
  const userRef = doc(db, "Users", userDoc.id);

  // rebuild cart array from quantities
  const firebaseCart = updatedCart.flatMap(item =>
    Array(item.quantity).fill(item.id)
  );

  await updateDoc(userRef, {
    cart: firebaseCart
  });
};


const increment = (product, q) => {
  setcartitems(prev => {
    const updated = prev
      .map(item => {
        if (item.id !== product.id) return item;

        if (q === -1 && item.quantity === 1) {
          return null; // remove item
        }

        return {
          ...item,
          quantity: item.quantity + q
        };
      })
      .filter(Boolean);

    // 🔥 push changes to Firebase
    syncCartToFirebase(updated);

    return updated;
  });
};


useEffect(() => {
  const totalPrice = cartitems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  settotalorder(totalPrice);
  settotalorderpercent(Math.min((totalPrice / 200) * 100, 100));
}, [cartitems]);


  return (
    <div className='d-flex flex-column' style={{minHeight:'100vh',justifyContent:'space-between'}}>
      <div className={`startinganimation ${products.length > 0 ? '' : 'active'}`}>
        <div className={`imgcontainer ${products.length > 0 ? '' : 'active'}`}>
<img src={logo} alt="" />
        </div>
        
      </div>

    <section >
        <Header />


        <div className='w-100 d-flex justify-content-center'>
        <div className='maxw w-100' style={{marginTop:'150px'}}>
<h2 className='px-5 fw-bold'>Shopping Cart</h2>


{cartitems?.length > 0 ? <div className='freeshipping w-100'>
  {totalorder < 200 ? <h5 className='m-0'>Great! You are {200 - totalorder} EGP Away from Getting <span>Free Shipping</span></h5> : 
  <h5 className='m-0'>Congratulations!🎉 you now have <span>Free Shipping</span></h5>}

<div className='w-100 d-flex align-items-center justify-content-center gap-2' style={{marginTop:'20px'}}>   <p className='m-0 fw-bold'> EGP 0</p>
<div className='inicatorcontainer w-50'>

<div className='indicator' style={{width:`${totalorderpercent}%`}}></div>
</div>
<div className='text-center'>
<p className='m-0 fw-bold'>200EGP </p>

<p className='m-0 fw-bold'>Free Shipping</p>

</div>


</div>
<div className='row w-100 px-5 mt-5'>
<div className="col-6 fw-bold ps-4">Product</div>
<div className="col-2 fw-bold jc-end">Price</div>
<div className="col-2 fw-bold jc-end">Quantity</div>
<div className="col-2 fw-bold jc-end">Total</div>
{cartitems.map((product) =>(
  <>
  <div className="col-6 d-flex mt-4">
    <div className='cartitemimage'><img src={product.image} alt="" /></div>
    <div className='py-4 d-flex flex-column'>
      <p className='m-0'>{product.name}</p>
            <p className='m-0 fw-normal ' style={{fontSize:'12px'}}>{product.category}</p>

    </div>
  </div>
<div className="col-2 mt-4 pt-3 jc-end">{product.price}.00 EGP</div>
<div className="col-2  mt-4 pt-3 text-center d-flex gap-3 fw-bold jc-end"> <p className='p-2 cursor-pointer m-0' style={{height:40}} onClick={()=> increment(product,-1)}>-</p>  <p className='p-2 m-0' >{product.quantity}</p>  <p className='p-2 cursor-pointer m-0' style={{height:40}} onClick={()=> increment(product,1)}>+</p></div>
<div className="col-2 mt-4 pt-3 jc-end">{product.price * product.quantity}.00 EGP</div>
</>
))}
</div>
 <div className='w-100 d-flex align-items-end justify-content-center pe-5 mt-4 flex-column'>
<p className='fw-bold fs-4 m-0 '>Sub Total: {totalorder + 45}.00 EGP</p>
<div className='d-flex align-items-center mt-3 gap-3'>
  <Link to="/" ><p className='m-0 text-decoration-underline fw-bold cursor-pointer'>Continute Shopping</p></Link>
<button className=' checkout fw-bold underline'>GO TO CHECKOUT</button>
</div>
</div> </div>:  <h1 className='w-100 text-center'>Your cart is Currently Empty</h1>}


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
  )
}
