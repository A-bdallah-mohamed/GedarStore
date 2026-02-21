import React from 'react';
import Header from '../Components/Header';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok, FaTelegramPlane } from "react-icons/fa";

const CustomCategory = () => {
  return (
    <div className='d-flex flex-column' style={{ minHeight: '100vh' }}>
      <Header />

      <section
        className='d-flex align-items-center justify-content-center'
        style={{ flex: 1, marginTop: '120px' }}
      >
        <h1 className='m-0'>Coming Soon...</h1>
      </section>

      <footer className='d-flex align-items-center justify-content-center '>
        <div className='maxw d-flex align-items-center justify-content-center gap-2'>
          <div className='d-flex gap-2'>
            <a href="https://www.instagram.com/gedarstore?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="><FaInstagram /></a>
            <a href="https://www.tiktok.com/@gedarstore?lang=ar"><FaTiktok /></a>
            <a href="https://t.me/gedarstoreeg"><FaTelegramPlane /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomCategory;
