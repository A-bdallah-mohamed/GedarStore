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



export default function Cart() {


  const { products } = useGlobal();


const user = auth.currentUser

 const [cartitems, setcartitems] = useState([]);
 const [totalorder, settotalorder] = useState();
 const [totalorderpercent, settotalorderpercent] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        const q = query(collection(db, "Users"), where("User", "==", user.email));
        const currentuser = await getDocs(q);

        if (currentuser.empty) return;

        const userDoc = currentuser.docs[0];
        const userData = userDoc.data();

        // count each product id
        const countMap = userData.cart.reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {});

        // map to unique products with quantity
        const uniqueProducts = products
          .filter(p => countMap[p.id])
          .map(p => ({ ...p, quantity: countMap[p.id] }));

        setcartitems(uniqueProducts);
const totalPrice = cartitems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
settotalorder(totalPrice)
settotalorderpercent((totalorder / 200) * 100)

        console.log("Cart items:", uniqueProducts); // log the correct updated value
      }
    };

    fetchCart();
  }, [user, db, products]);
  


  return (
    <div className='d-flex flex-column'>
      <div className={`startinganimation ${products.length > 0 ? '' : 'active'}`}>
        <div className={`imgcontainer ${products.length > 0 ? '' : 'active'}`}>
<img src={logo} alt="" />
        </div>
        
      </div>

    <section >
        <Header />
        <div className='maxw' style={{marginTop:'150px'}}>
<h2 className='px-5 fw-bold'>Shopping Cart</h2>


{cartitems.length > 0 ? <div className='freeshipping w-100'>
<h5 className='m-0'>Great! You are {200 - totalorder} EGP Away from Getting <span>Free Shipping</span></h5>
<div className='w-100 d-flex align-items-center justify-content-center gap-2' style={{marginTop:'20px'}}>   <p className='m-0 fw-bold'> EGP 0</p>
<div className='inicatorcontainer w-50'>

<div className='indicator' style={{width:totalorderpercent}}></div>
</div>
<div className='text-center'>
<p className='m-0 fw-bold'>200EGP </p>

<p className='m-0 fw-bold'>Free Shipping</p>

</div>
</div>

</div>:  <h1 className='w-100 text-center'>Your cart is Currently Empty</h1>}

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
