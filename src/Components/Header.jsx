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
import { auth } from "../firebase/firebaseconfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase/firebaseconfig";

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



  const { products } = useGlobal();
const [query,setquery] =  useState("")
  const searchcontainer = useRef(null)
  const searchbar = useRef(null)
  const [open, setOpen] = useState(false);
const [searchresults,setsearchresults] = useState([])

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
      if (searchcontainer.current && !searchbar.current.contains(event.target)) {
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
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    setsearchresults([]);
    return;
  }

  const exactMatches = [];
  const partialMatches = [];

  products.forEach(product => {
    const matches = product?.searchwords?.some(sw => {
      const word = normalize(sw);
      const words = word.split(" ");
      return words.includes(normalizedQuery); // whole word match
    });

    if (matches) {
      exactMatches.push(product);
      return;
    }

    // partial match fallback
    const partial = product?.searchwords?.some(sw =>
      normalize(sw).includes(normalizedQuery)
    );

    if (partial) {
      partialMatches.push(product);
    }
  });

  // exact first, then partial
  setsearchresults([...exactMatches, ...partialMatches]);
}, [query, products]);

const hasLetters = /[a-z]/i.test(query.trim());



  return (
    <div className='headercontainer'>
    <header>
      
            <div className='searchcontainer' ref={searchcontainer}>
      
      <div className='searchbar ' ref={searchbar}>
        <h4 className='mt-3 w-100 px-4'>Search</h4>
        <div className='w-100 py-3 px-4 d-flex align-items-center justify-content-between'>
<input type="text" placeholder='Search For...' className='border-0 w-100' onChange={(e)=>setquery(e.target.value)}/>
          
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
            <div style={{width:'200px'}}>
              <button>
        <RxHamburgerMenu className='icon' />
</button>
            </div>
        <Link to='/'>
        <img src={logo} alt=""  onClick={scrollToTop}/>
        </Link>
        <div className='d-flex align-items-center gap-2 justify-content-end' style={{width:'200px'}}>
          <button onClick={searchopen}>
        <IoIosSearch className='icon'/>
        </button>
        <Link to="/Login">

        <MdOutlineAccountCircle className='icon'/> </Link>
                  <button>
                <FaRegHeart className='icon'/>
                        </button>
                                  
     <Link to="/Cart">
        <IoBag className='icon'/>
                       </Link>

        </div>
    </header>
    </div>
  )
}
