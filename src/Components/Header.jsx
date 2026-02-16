import React from 'react'
import logo from '../Assets/logo.png'
import '../App.css'
import { RxHamburgerMenu } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import { MdOutlineAccountCircle } from "react-icons/md";
import { IoBag } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";
import { useRef } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useEffect } from 'react';
import { useState } from 'react';
import { useGlobal } from '../App';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebaseconfig";
import { FaAngleDown } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseconfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";

export default function Header() {






  // const sendEmail = async (email) => {
  //   const functions = getFunctions(app);
  //   const callSendEmail = httpsCallable(functions, "sendEmail");

  //   try {
  //     const result = await callSendEmail({
  //       to: email,
  //       subject: "Welcome To Gedar!",
  //       message: "Thanks for signing up"
  //     });

  //     console.log(result.data); // { success: true }

  //   } catch (error) {
  //     console.error(error);
  //   }
  // };


const navigate = useNavigate();

  const { products } = useGlobal();
const [queryy,setqueryy] =  useState("")
  const searchcontainer = useRef(null)
    const sidemenu = useRef(null)
    const sidemenucontainer = useRef(null)

  const searchbar = useRef(null)
  const [open, setOpen] = useState(false);
const [searchresults,setsearchresults] = useState([])
const [sidemenuactive,setSidemenuactive] = useState(false)
const [framesmenu,setframesmenu] = useState(false)
const [cartcount,setcartcount] = useState(0)

  const user = auth.currentUser;

useEffect(() => {
  if (!user) return;

  const fetchCart = async () => {
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() || {};
      const rawCart = Array.isArray(userData.cart) ? userData.cart : [];

      // do something with rawCart, e.g., set state
      setcartcount(rawCart.length); // assuming you have a state for cart items
    }
  };

  fetchCart();
}, [user]);


const toggleframesmenu = () => {
  console.log(framesmenu)
  setframesmenu(!framesmenu)
}

const toggleSidemenu = (e) => {
  console.log(sidemenuactive)
  if(sidemenucontainer.current && !sidemenu.current.contains(e.target)){
      console.log('inside if')

  setSidemenuactive(!sidemenuactive)
  }
}

const searchopen = () => {
  if (searchcontainer.current) {
 searchcontainer.current.classList.add('active')
  }
document.body.style.overflow = 'hidden';
}
  const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

const searchclose = () => {
   if (searchcontainer.current) {
 searchcontainer.current.classList.remove('active')
  }
          document.body.style.overflow = "auto"; 

}


 useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchcontainer.current && !searchbar.current.contains(event.target) && !sidemenu.current.contains(event.target)) {
         searchcontainer.current.classList.remove('active')
        setOpen(false);
        document.body.style.overflow = "auto"; 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
useEffect(() => {
  const normalize = (text = "") => text.toLowerCase().trim();
  const normalizedQueryy = normalize(queryy);

  if (!normalizedQueryy) {
    setsearchresults([]);
    return;
  }

  const exactMatches = [];
  const partialMatches = [];

  products.forEach(product => {
    const matches = product?.searchwords?.some(sw => {
      const word = normalize(sw);
      const words = word.split(" ");
      return words.includes(normalizedQueryy); // whole word match
    });

    if (matches) {
      exactMatches.push(product);
      return;
    }

    // partial match fallback
    const partial = product?.searchwords?.some(sw =>
      normalize(sw).includes(normalizedQueryy)
    );

    if (partial) {
      partialMatches.push(product);
    }
  });

  // exact first, then partial
  setsearchresults([...exactMatches, ...partialMatches]);
}, [queryy, products]);

const hasLetters = /[a-z]/i.test(queryy.trim());

useEffect(() => {
  if (sidemenuactive) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }
},[sidemenuactive]);

  return (
    <div className='headercontainer'>
    <header>
      
            <div className='searchcontainer' ref={searchcontainer}>
      
      <div className='searchbar ' ref={searchbar}>
        <h4 className='mt-3 w-100 px-4'>Search</h4>
        <div className='w-100 py-3 px-4 d-flex align-items-center justify-content-between'>
<input type="text" placeholder='Search For...' className='border-0 w-100' onChange={(e)=>setqueryy(e.target.value)}/>
          
          <button onClick={searchclose}><i class="bi bi-x-lg fs-3" ></i></button>

        </div>



<div className='searchresultcontainer mt-3'>

<div style={{ width: '100%'}} className='px-5 d-flex flex-column gap-3'> 
{hasLetters &&
  searchresults.map((product) => (
<div className='searchresult'>
  <img src={product.image} alt="" />
  <div className='d-flex flex-column py-2'>
    <h4 className='m-0'>{product.name}</h4>
        <p className='m-0 text-muted'>{product.category}</p>

    <p className='m-0 text-muted'>EGP {product.price}</p>
  </div>
</div>
  ))
}



</div>

</div>

      </div>
      
            </div>

<div className={`sidemenu ${sidemenuactive ? 'active' : ''}`} ref={sidemenucontainer} onClick={(e)=>toggleSidemenu(e)}>
  <div className={`component ${sidemenuactive ? 'active' : ''}` } ref={sidemenu}>

<div className='head'>
  <h4>Menu</h4>
   <button onClick={()=>setSidemenuactive(false)}><i class="bi bi-x-lg fs-3" ></i></button>
</div>
<div className='body'>
  <ul className='mainul'>
    <li onClick={() => {setSidemenuactive(false); navigate("/");}}>Home</li>
    <li >Stickers</li>
    <li>
      <li onClick={()=>toggleframesmenu()} className={`submenuframes ${framesmenu ? 'active' : ''}`} style={{ padding: '8px 0', width: '100%', textAlign: 'left' }}
>Frames <FaAngleDown className='i'/></li>
        <ul className={`framesubmenu ${framesmenu ? 'active' : ''}`}>
          <li>20 x 30</li>
          <li>30 x 40</li>
        </ul>
    </li>
    <li>Custom Designs</li>
    <li onClick={() => {setSidemenuactive(false); navigate("/Cart");}}>My Cart</li>
    <li>My Account</li>
  </ul>
</div>
  </div>
</div>


            <div style={{width:'200px'}}>
              <button onClick={(e)=>toggleSidemenu(e)}>
        <RxHamburgerMenu className='icon' />
</button>
            </div>
        <Link to='/'>
        <img src={logo} alt=""  onClick={scrollToTop}/>
        </Link>
        <div className='d-flex align-items-center gap-2 justify-content-end' style={{width:'200px'}}>
          <button onClick={searchopen} >
        <IoIosSearch className='icon' />
        </button>
        <Link to="/Profile" className='hideonsmallscreens'>

        <MdOutlineAccountCircle className='icon' /> </Link>
                  <Link to="/wishlist" className='hideonsmallscreens'>
                <FaRegHeart className='icon'/>
                     </Link>

     <Link to="/Cart" className='cartlink'>
     <div className='cartcount'>{cartcount}</div>
        <IoBag className='icon'/>
                       </Link>

        </div>
    </header>
    </div>
  )
}
