import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";

export const addtocart = async (product, e, user, activesize,quantity) => {
  // Determine product price safely
  let productPrice = product.price; // default
  if (product.category === "Frames") {
    if (activesize === "20x30") productPrice = product.smallframeprice ?? product.price;
    else if (activesize === "30x40") productPrice = product.bigframeprice ?? product.price;
    else {
      console.warn("Select a valid frame size");
      return; // Stop if no size selected
    }
  }

  const safeQuantity = Math.max(1, Number(quantity) || Number(product?.quantity) || 1);
  const itemsToAdd = Array.from({ length: safeQuantity }, () => ({
    id: product.id,
    price: productPrice,
  }));

  if (user) {
    // Firebase user cart
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const currentuser = await getDocs(q);
    if (currentuser.empty) return;

    const userDoc = currentuser.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const existingCart = Array.isArray(userData.cart) ? userData.cart : [];
    const newCart = [...existingCart, ...itemsToAdd];

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, { ...userData, cart: newCart });

    console.log("Product added to Firebase:", { id: product.id, price: productPrice, quantity: safeQuantity });
  } else {
    // LocalStorage cart
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart = [...cart, ...itemsToAdd];
    localStorage.setItem("cart", JSON.stringify(cart));

    console.log("Product added to localStorage:", { id: product.id, price: productPrice, quantity: safeQuantity });
  }

  // Visual feedback for "added" div

};
