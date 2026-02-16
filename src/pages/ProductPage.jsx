import React,{useState,useEffect} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import logo from '../Assets/logo.png'
import { FaChevronDown } from "react-icons/fa";
import { useGlobal } from '../App';
import { addtocart } from '../GlobalStates/AddToCart';
import { auth } from "../firebase/firebaseconfig";
import { useNavigate } from 'react-router-dom';
export default function ProductPage({product}) {
        const [activesize,setactivesize] = useState(null);
const user = auth.currentUser;

const navigate = useNavigate();

  return (
     <div className='d-flex flex-column'>
     
       <section className='mainsection productpage' >
           <Header />
           <div className='d-flex gap-5' style={{marginTop:"150px"}}>
        <div className='imgcontainer  d-flex align-items-center justify-content-center' style={{minWidth:"50%"}}> 
<img src={`${product.image}`} alt="" style={{maxWidth:"80%"}}/> 
        </div>
        <div className='poductdetailscontainer px-5' style={{marginTop:"50px"}}>
<p style={{fontWeight:"500",color:'#7a7a7aff'}} className='m-0'>GedarStore/{product.category}</p>
<p className='fs-1 m-0 '>{product.name}</p>
<p className='fs-3 m-0' style={{color:'#ff6344ff'}}>{product.category === 'Frames' ? 
       <> {activesize === null ? <>Select Size To See Price</> :
        <>{activesize === "20x30" ? <span>L.E. {product.smallframeprice}</span> : <span>L.E. {product.bigframeprice}</span>}</>} </>: 
<>L.E. {product.price}</>}</p>
{product.category === 'Frames' ? <div className='sizebuttonscontainer'>
<button className={`${activesize === "20x30" ? "active" : ""}`} onClick={()=>setactivesize("20x30")}>20 X 30</button>
<button className={`${activesize === "30x40" ? "active" : ""}`} onClick={()=>setactivesize("30x40")}>30 X 40</button></div> : <></>}
<p className='mt-4' style={{color:'#000000ff'}}>{product.description}</p>
<div className='w-100 mt-4 buttonscontainer'>
        
<button className='w-100 text-white ' 
style={{backgroundColor:'rgb(221, 85, 58)',border:'none',padding:'10px',fontWeight:'500',borderRadius:'50px'}}
onClick={async (e) => {
  e.preventDefault();                  
  await addtocart(product, e, user, activesize); 
  navigate('/Cart');                   
}}>Add to cart</button>

</div>
        </div>
           </div>
           </section>
   
       
           </div>
  )
}
