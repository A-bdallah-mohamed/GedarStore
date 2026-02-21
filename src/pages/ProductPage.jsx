import React,{useState} from 'react'
import Header from '../Components/Header'
import Productslider from '../Components/Productslider'
import { addtocart } from '../GlobalStates/AddToCart';
import { auth } from "../firebase/firebaseconfig";
import { useGlobal } from '../App';
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
export default function ProductPage({product}) {
  const [selectedSize,setSelectedSize] = useState(null);
  const [quantity,setQuantity] = useState(1);
  const user = auth.currentUser;
  const { products = [] } = useGlobal() || {};

  const isFrame = product?.category === 'Frames';
  const isOutOfStock = Number(product?.stock ?? 1) <= 0;
  const similarProducts = products.filter(
    (item) => item.category === product?.category && item.id !== product?.id
  );

  const getFramePrice = (item, size) => {
    if (!size) return null;
    return size === '20x30' ? Number(item?.smallframeprice || 0) : Number(item?.bigframeprice || 0);
  };

  const addToCart = async (e) => {
    e.preventDefault();
    if (isFrame && !selectedSize) return;

    const productWithQuantity = {
      ...product,
      quantity,
    };

    await addtocart(productWithQuantity, e, user, selectedSize,quantity);
    alert('Product added to cart successfully!');
  };

  return (
     <div className='d-flex flex-column'>
     
  <section className="mainsection productpage" >
        <Header /> 
        <div className="productpage-main d-flex gap-5 align-items-start pt-5" style={{ marginTop: "130px" }}>
          {/* Image */}
          <div
            className="imgcontainer d-flex align-items-center justify-content-center"
            style={{ minWidth: "50%" }}
          >
            <img
              src={product.imageUrl || product.image}
              alt={product.name}
              style={{ maxWidth: "80%" }}
            />
          </div>

          {/* Details */}
          <div className="poductdetailscontainer px-5">
            <p style={{ fontWeight: 500, color: "#7a7a7a" }} className="m-0">
              GedarStore / {product.category}
            </p>

            <p className="fs-1 m-0">{product.name}</p>
            {isOutOfStock && (
              <span className="badge bg-danger" style={{ marginBottom: "8px" }}>
                Out of stock
              </span>
            )}

            {/* Price */}
            <p className="fs-3 m-0" style={{ color: "#ff6344" }}>
              {(() => {
                if (isFrame && !selectedSize) return "Choose size to see price";

                const basePrice = isFrame
                  ? getFramePrice(product, selectedSize)
                  : Number(product.price || 0);

                return `L.E. ${basePrice || "N/A"}`;
              })()}
            </p>

            {/* Description */}
            <div className="mt-2">
              <h5 className="fw-bold mb-3" style={{color: "#333"}}>Product Description</h5>
              <p style={{
                lineHeight: "1",
                color: "#555",
                fontSize: "1rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}>
                {product.description || "No description available"}
              </p>
            </div>

            {/* Sizes */}
            {isFrame && (
              <div className="mt-2">
                <p className="fw-bold mb-2">Choose size:</p>

                <div className="d-flex gap-2">
                  <button
                    className={`btn fw-bold ${
                      selectedSize === "20x30"
                        ? "btn-dark"
                        : "btn-outline-dark"
                    }`}
                    style={
                      selectedSize === "20x30"
                        ? {
                            backgroundColor: "#1f2730",
                            color: "#f2d5bd",
                            border: "2px solid #1f2730"
                          }
                        : {
                            color: "#1f2730",
                            borderColor: "#1f2730"
                          }
                    }
                    onClick={() => {
                      setSelectedSize("20x30");
                    }}
                  >
                    20 × 30
                  </button>

                  <button
                    className={`btn fw-bold ${
                      selectedSize === "30x40"
                        ? "btn-dark"
                        : "btn-outline-dark"
                    }`}
                    style={
                      selectedSize === "30x40"
                        ? {
                            backgroundColor: "#1f2730",
                            color: "#f2d5bd",
                            border: "2px solid #1f2730"
                          }
                        : {
                            color: "#1f2730",
                            borderColor: "#1f2730"
                          }
                    }
                    onClick={() => {
                      setSelectedSize("30x40");
                    }}
                  >
                    30 × 40
                  </button>
                </div>
              </div>
            )}

            {selectedSize && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#006eb5",
                  marginTop: "10px",
                }}
              >
                Selected size: {selectedSize}
              </p>
            )}

            {/* Quantity */}
            <div className="mb-3 mt-4">
              <label className="form-label fw-bold">Quantity:</label>
              <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{width: "40px", height: "40px", padding: "0"}}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  className="form-control text-center"
                  style={{ width: "80px" }}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{width: "40px", height: "40px", padding: "0"}}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="w-100 mt-5 buttonscontainer">
              <button
                className="w-100 fw-bold"
                style={{
                  backgroundColor: isOutOfStock || (isFrame && !selectedSize) ? "#ccc" : "#1f2730",
                  color: "#f2d5bd",
                  border: "none",
                  padding: "18px 20px",
                  fontSize: "1.1em",
                  fontWeight: "600",
                  borderRadius: "50px",
                  cursor: isOutOfStock || (isFrame && !selectedSize) ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(31, 39, 48, 0.3)"
                }}
                disabled={isOutOfStock || (isFrame && !selectedSize)}
                onClick={addToCart}
                onMouseEnter={(e) => {
                  if (!(isOutOfStock || (isFrame && !selectedSize))) {
                    e.target.style.backgroundColor = "#16191f";
                    e.target.style.boxShadow = "0 6px 20px rgba(31, 39, 48, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isOutOfStock || (isFrame && !selectedSize))) {
                    e.target.style.backgroundColor = "#1f2730";
                    e.target.style.boxShadow = "0 4px 15px rgba(31, 39, 48, 0.3)";
                  }
                }}
              >
                {isOutOfStock
                  ? "Out of stock"
                  : isFrame && !selectedSize
                  ? "Select size first"
                  : "Add to cart"}
              </button>
            </div>
          </div>
        </div>

          {similarProducts.length > 0 && (
        <section className='mt-5 mb-5'>
          <Productslider
            products={similarProducts}
            category={product?.category}
            title='Similar Products'
          />
        </section>
      )}
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
      </section>

    
       
           </div>
  )
}
