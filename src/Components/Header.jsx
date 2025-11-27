import React from 'react'
import logo from '../Assets/logo.png'
import '../App.css'
import { RxHamburgerMenu } from "react-icons/rx";
import { IoIosSearch } from "react-icons/io";
import { MdOutlineAccountCircle } from "react-icons/md";
import { IoBag } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";

export default function Header() {
  const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

  return (
    <div className='headercontainer'>
    <header>
        <RxHamburgerMenu className='icon' style={{flex:'.1'}}/>
        <img src={logo} alt=""  onClick={scrollToTop}/>
        <div className='d-flex align-items-center gap-4'>
        <IoIosSearch className='icon'/>
        <Link to="/Login">
        <MdOutlineAccountCircle className='icon'/> </Link>
                <FaRegHeart className='icon'/>

        <IoBag className='icon'/>

        </div>
    </header>
    </div>
  )
}
