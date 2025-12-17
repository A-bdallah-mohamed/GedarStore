import React,{useState,useEffect} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import logo from '../Assets/logo.png'
import { FaChevronDown } from "react-icons/fa";
import { useGlobal } from '../App';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";


export default function Mainpage() {

  const { products } = useGlobal();
  const { banners } = useGlobal();

const mainbanner = banners.find(b => b.name === "Main")

const [categories,setcategories] = useState([])

useEffect(() => {
 if (products.length > 0) {
  setcategories([...new Set(products.map( p => p.category))])
console.log(categories)
  }},[products,mainbanner])

function scrollvh() {
  const distance = window.innerHeight * 0.8; 
  window.scrollBy({
    top: distance,
    behavior: 'smooth' 
  });
}

  return (
    <div className='d-flex flex-column'>
      <div className={`startinganimation ${products.length > 0 ? '' : 'active'}`}>
        <div className={`imgcontainer ${products.length > 0 ? '' : 'active'}`}>
<img src={logo} alt="" />
        </div>
        
      </div>
    <section className='mainsection' style={{backgroundImage: `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6)), url(${mainbanner?.img})`,backgroundSize:'cover'}}>
        <Header />
        <div className='d-flex justify-content-end flex-column h-100 mainsectioncontent'>
          <div>
   <button onClick={scrollvh}>Shop now <FaChevronDown />
</button>
   </div>
        </div>
        </section>

        <section className='mt-5'>
{categories.map((cat, index) => (
  <Productslider
    products={products.filter(p => p.category === cat)}
    category={cat}
    key={index}
  />
))}
</section>
<section className=' d-flex align-items-center justify-content-center'>
  <div className='maxw'>
    <div className="row">
<div className="col-4">
  <div className="catimgcontainer">
    <img src={banners[2]?.img} alt="" />
    <p>Stickers</p>
  </div>
</div>
<div className="col-4">
  <div className="catimgcontainer">
    <img src={banners[7]?.img} alt="" />
    <p>Frames</p>
  </div>
</div>
<div className="col-4">
  <div className="catimgcontainer">
    <img src={banners[4]?.img} alt="" />
    <p>Labtop stickers</p>
  </div>
</div>
</div>
</div>
</section>


<section className='followourinsta d-flex align-items-center justify-content-center'>
  <div className='maxw'>
  <h1 >Follow our Instagram account</h1>
  <div className="row">
        <div className="col-3 p-0">  

      <a href='https://www.instagram.com/gedarstore?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='>
      <div className="instaimgcontainer">
    <img src={banners[1]?.img} alt="" />
    <p><FaInstagram />
</p>
  </div>
</a>
  
  </div>
    <div className="col-3 p-0"> 

<a href="https://www.instagram.com/p/DG8J2BlIpix/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==">

      <div className="instaimgcontainer">
    <img src={banners[0]?.img} alt="" />
    <p><FaInstagram />
</p>
  </div>

</a>

  </div>
    <div className="col-3 p-0">  


<a href="https://www.instagram.com/reel/DOi4UNvgguD/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==">
      <div className="instaimgcontainer">
    <img src={banners[6]?.img} alt="" />
    <p><FaInstagram />
</p>
  </div>
</a>


  </div>
    <div className="col-3 p-0"> 


<a href="https://www.instagram.com/p/DBRJuSCigb4/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==">
      <div className="instaimgcontainer">
    <img src={banners[3]?.img} alt="" />
    <p><FaInstagram />
</p>
  </div>
</a>


  </div>

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
