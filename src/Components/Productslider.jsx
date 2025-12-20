import React from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Link } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";

export default function Productslider({products,category}) {
  const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")    
    .replace(/[^a-z0-9-]/g, ""); 

    if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <div className=' slider  d-flex flex-column mt-3'>
      <div className='w-100 d-flex justify-content-between px-4  maxw'>
      <h1>{category}</h1>
      <p>View all</p>
      </div>
        <div className='Productslider maxw'>

{products.length > 0 ? (
  products.map((product,index) => (

  <div className='product gap-3' key={product.id} >
      
      
      <div className="imgcontainer">
        <Link to={`/products/${slugify(product.name)}`} className='navlink'>
        <img src={product.image} alt="" /></Link>
        <button className='addtocarthvrbtn' onClick={()=> console.log('add to cart')}>+ Add to Cart</button>
                <button className='addtowshlsthvrbtn' onClick={()=> console.log('add to cart')}><FaRegHeart /> Add to Wishlist</button>

      </div>
      <div className='w-100'>
          <Link to={`/products/${slugify(product.name)}`} className='navlink'>
      <h5>{product.name}</h5></Link>
      <p>LE {product.price}.00</p>
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
