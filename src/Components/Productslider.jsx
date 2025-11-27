import React from 'react'
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

export default function Productslider({products = [],category}) {
    if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <div className=' slider  d-flex flex-column mt-3'>
      <div className='w-100 d-flex justify-content-between px-4  maxw'>
      <h1>{category}</h1>
      <p>View all</p>
      </div>
        <div className='Productslider maxw'>

{products.length > 0 ? (
  products.map(product => (
    <div className='product gap-3' key={product.id}>
      
      
      <div className="imgcontainer">
        <img src={product.image} alt="" />
      </div>
      <div className='w-100'>
      <h5>{product.name}</h5>
      <p>EGP {product.price}</p>
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
