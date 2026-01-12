import React,{useState,useEffect} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import logo from '../Assets/logo.png'
import { FaChevronDown } from "react-icons/fa";
import { useGlobal } from '../App';
export default function ProductPage({product}) {
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
<p className='fs-3 m-0' style={{color:'#ff6344ff'}}>L.E. {product.price}</p>

<p className='mt-4' style={{color:'#000000ff'}}>{product.description}</p>
<div className='w-100 mt-4 buttonscontainer'><button className='w-100 text-white ' style={{backgroundColor:'#006eb5',border:'none',padding:'20px',fontWeight:'500',borderRadius:'50px'}}>Add to cart</button></div>
        </div>
           </div>
           </section>
   
       
           </div>
  )
}
