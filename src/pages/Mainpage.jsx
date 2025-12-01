import React,{useState,useEffect} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import logo from '../Assets/logo.png'
import { FaChevronDown } from "react-icons/fa";
import { useGlobal } from '../App';
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
        </div>
  )
}
