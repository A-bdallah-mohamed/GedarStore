import React from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Link } from 'react-router-dom';
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
<Link to={`/products/${slugify(product.name)}`} className='navlink'>
  <div className='product gap-3' key={product.id} >
      
      
      <div className="imgcontainer">
        <img src={product.image} alt="" />
      </div>
      <div className='w-100'>
      <h5>{product.name}</h5>
      <p>EGP {product.price}</p>
      </div>
      </div>
      </Link>
  ))
) : (
  <p>Loading...</p>
)}

</div>
    </div>
  )
}
