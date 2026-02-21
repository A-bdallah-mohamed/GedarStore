import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../Components/Header'
import { useGlobal } from '../App'
import { FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";
import { FaTelegramPlane } from "react-icons/fa";
const slugify = (str = '') =>
        String(str)
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')

export default function CategoryPage() {
        const { products } = useGlobal()
        const { categorySlug } = useParams()
        const [currentPage, setCurrentPage] = useState(1)
        const PRODUCTS_PER_PAGE = 24

        const categories = useMemo(
                () => [...new Set((products || []).map((p) => p.category).filter(Boolean))],
                [products]
        )

        const selectedCategory = useMemo(() => {
                if (!categorySlug) return null
                return categories.find((cat) => slugify(cat) === categorySlug) || null
        }, [categories, categorySlug])

        const categoryProducts = useMemo(() => {
                if (!selectedCategory) return []
                return products.filter((product) => product.category === selectedCategory)
        }, [products, selectedCategory])

        const totalPages = useMemo(
                () => Math.max(1, Math.ceil(categoryProducts.length / PRODUCTS_PER_PAGE)),
                [categoryProducts.length]
        )

        const paginatedProducts = useMemo(() => {
                const start = (currentPage - 1) * PRODUCTS_PER_PAGE
                const end = start + PRODUCTS_PER_PAGE
                return categoryProducts.slice(start, end)
        }, [categoryProducts, currentPage])

        useEffect(() => {
                setCurrentPage(1)
        }, [categorySlug, selectedCategory])

        useEffect(() => {
                setCurrentPage((prev) => Math.min(prev, totalPages))
        }, [totalPages])

        return (
                <div className='d-flex flex-column' style={{height:"100vh"}}>
                                <Header />



                        {categorySlug && selectedCategory && (
<section className="d-flex justify-content-center" style={{ marginTop: "130px" }}>
                                          <div className='maxw'>
                                                <h2 className='mb-4 px-3'>{selectedCategory}</h2>

                                                <div className='row g-3 category-products-grid'>
                                                        {paginatedProducts.map((product) => (
                                                                <div className='col-6 col-md-4 col-lg-3 category-product-col' key={product.id}>
                                                                        <div className='product category-product-card gap-3 h-100'>
                                                                                <div className='imgcontainer'>
                                                                                        <Link to={`/products/${slugify(product.name)}`} className='navlink'>
                                                                                                <img src={product.image} alt={product.name} />
                                                                                        </Link>
                                                                                </div>

                                                                                <div className='w-100'>
                                                                                        <Link to={`/products/${slugify(product.name)}`} className='navlink'>
                                                                                                <h5>{product.name}</h5>
                                                                                        </Link>
                                                                                        <p className='m-0'>
                                                                                                {product.smallframeprice ? (
                                                                                                        <span>From LE {product.smallframeprice}.00</span>
                                                                                                ) : (
                                                                                                        <span>{product.price}.00 LE</span>
                                                                                                )}
                                                                                        </p>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                </div>

                                                {totalPages > 1 && (
                                                        <div className='d-flex justify-content-center mt-4 mb-2'>
                                                                <nav aria-label='Category pagination'>
                                                                        <ul className='pagination m-0 category-pagination'>
                                                                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                                        <button
                                                                                                className='page-link'
                                                                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                                                        >
                                                                                                Previous
                                                                                        </button>
                                                                                </li>

                                                                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                                                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                                                                <button className='page-link' onClick={() => setCurrentPage(page)}>
                                                                                                        {page}
                                                                                                </button>
                                                                                        </li>
                                                                                ))}

                                                                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                                                        <button
                                                                                                className='page-link'
                                                                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                                                        >
                                                                                                Next
                                                                                        </button>
                                                                                </li>
                                                                        </ul>
                                                                </nav>
                                                        </div>
                                                )}
                                        </div>
                                </section>
                        )}


                        {categorySlug && !selectedCategory && (
                                <section className='mt-5 text-center'>
                                        <h4>Category not found</h4>
                                        <Link to='/' className='navlink'>
                                                Back to home
                                        </Link>
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
                </div>
        )
}
