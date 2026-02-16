import React from "react";
import { Link } from "react-router-dom";

export default function CategorySlider({ banners }) {
  return (
    <div className="category-slider-custom">
      {banners.map((banner, idx) => (
        <Link
          key={idx}
          to={banner.link}
          className="category-slide-custom navlink"
        >
          <div className="category-slide-imgwrap">
            <img src={banner.img} alt={banner.title} />
          </div>
          <div className="category-slide-title">{banner.title}</div>
        </Link>
      ))}
    </div>
  );
}