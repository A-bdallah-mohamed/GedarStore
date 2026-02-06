import { auth } from "../firebase/firebaseconfig";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseconfig";

export const addToWishlist = async (product, e, user, activesize) => {

  if (user) {
    const q = query(collection(db, "Users"), where("User", "==", user.email));
    const currentuser = await getDocs(q);
    if (currentuser.empty) return;

    const userDoc = currentuser.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

const newWishlist = userData?.wishlist
  ? [
      ...userData.wishlist,
      {
        id: product.id
      }
    ]
  : [
      {
        id: product.id
      },
    ];

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, { ...userData, wishlist: newWishlist });

    console.log("Product added to Firebase wishlist:", { id: product.id});
  } else {
    let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    wishlist.push({ id: product.id });
    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    console.log("Product added to wishlist:", { id: product.id });
  }


};
