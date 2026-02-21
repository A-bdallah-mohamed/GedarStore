const normalizeRuleType = (coupon = {}) => {
  if (coupon.ruleType) return coupon.ruleType;
  if (coupon.buyQty || coupon.getQty) return "bogo";
  if (coupon.category || (Array.isArray(coupon.categories) && coupon.categories.length > 0)) {
    return "category";
  }
  return "coupon";
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isCouponActive = (coupon = {}) => {
  if (coupon.isActive === false) return false;

  const expiry = toDate(coupon.expiryDate);
  if (!expiry) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry >= today;
};

const getItemCategory = (item = {}) => String(item.category || "").trim().toLowerCase();

export const calculateCategoryDiscount = (cartItems = [], coupons = []) => {
  if (!Array.isArray(cartItems) || !Array.isArray(coupons)) {
    return { total: 0, details: [] };
  }

  const categoryCoupons = coupons.filter(
    (coupon) => normalizeRuleType(coupon) === "category" && isCouponActive(coupon)
  );

  let total = 0;
  const details = [];

  categoryCoupons.forEach((coupon) => {
    const categories = Array.isArray(coupon.categories)
      ? coupon.categories
      : coupon.category
      ? [coupon.category]
      : [];

    const normalizedCategories = categories.map((category) =>
      String(category || "").trim().toLowerCase()
    );

    if (!normalizedCategories.length) return;

    const matchedSubtotal = cartItems.reduce((sum, item) => {
      const itemCategory = getItemCategory(item);
      if (!itemCategory || !normalizedCategories.includes(itemCategory)) return sum;
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);

    if (matchedSubtotal <= 0) return;

    const discountValue = Number(coupon.discountValue || 0);
    if (discountValue <= 0) return;

    let amount = 0;
    if (coupon.discountType === "percentage") {
      amount = (matchedSubtotal * discountValue) / 100;
    } else {
      amount = discountValue;
    }

    if (coupon.maxDiscount) {
      amount = Math.min(amount, Number(coupon.maxDiscount || 0));
    }

    amount = Math.max(0, Math.min(matchedSubtotal, amount));

    if (amount > 0) {
      total += amount;
      details.push({
        type: "category",
        code: coupon.code || null,
        amount,
        categories,
      });
    }
  });

  return {
    total: Number(total.toFixed(2)),
    details,
  };
};

export const calculateBogoDiscount = (cartItems = [], coupons = []) => {
  if (!Array.isArray(cartItems) || !Array.isArray(coupons)) {
    return { total: 0, details: [] };
  }

  const bogoCoupons = coupons.filter(
    (coupon) => normalizeRuleType(coupon) === "bogo" && isCouponActive(coupon)
  );

  let total = 0;
  const details = [];

  bogoCoupons.forEach((coupon) => {
    const buyQty = Math.max(1, Number(coupon.buyQty || 1));
    const getQty = Math.max(1, Number(coupon.getQty || 1));
    const cycleQty = buyQty + getQty;

    const categories = Array.isArray(coupon.categories)
      ? coupon.categories
      : coupon.category
      ? [coupon.category]
      : [];

    const normalizedCategories = categories.map((category) =>
      String(category || "").trim().toLowerCase()
    );

    cartItems.forEach((item) => {
      const itemCategory = getItemCategory(item);
      if (normalizedCategories.length > 0 && !normalizedCategories.includes(itemCategory)) {
        return;
      }

      const quantity = Math.max(0, Number(item.quantity || 0));
      const unitPrice = Math.max(0, Number(item.price || 0));
      if (quantity < cycleQty || unitPrice <= 0) return;

      const freeQty = Math.floor(quantity / cycleQty) * getQty;
      if (freeQty <= 0) return;

      const amount = freeQty * unitPrice;
      total += amount;

      details.push({
        type: "bogo",
        productId: item.productId || item.id || null,
        freeQty,
        amount,
        code: coupon.code || null,
      });
    });
  });

  return {
    total: Number(total.toFixed(2)),
    details,
  };
};
