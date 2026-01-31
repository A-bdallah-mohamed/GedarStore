import { auth } from "../firebase/firebaseconfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";

export const addtocart = async (product, e, user, activesize) => {
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

  if (user) {
    // Firebase user cart
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const currentuser = await getDocs(q);
    if (currentuser.empty) return;

    const userDoc = currentuser.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const newCart = userData.cart
      ? [...userData.cart, { id: product.id, price: productPrice }]
      : [{ id: product.id, price: productPrice }];

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, { ...userData, cart: newCart });

    console.log("Product added to Firebase:", { id: product.id, price: productPrice });
  } else {
    // LocalStorage cart
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ id: product.id, price: productPrice });
    localStorage.setItem("cart", JSON.stringify(cart));

    console.log("Product added to localStorage:", { id: product.id, price: productPrice });
  }

  // Visual feedback for "added" div

};
