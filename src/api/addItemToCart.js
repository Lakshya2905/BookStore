import axios from 'axios';
import { CART_ITEM_ADD_URL } from '../constants/apiConstants';

const getUserData = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const token = sessionStorage.getItem("token");
    return { user, token };
  } catch (error) {
    console.error("Error parsing user data:", error);
    return { user: null, token: null };
  }
};

const addItemToCart = async (bookId) => {
  try {
    const { user, token } = getUserData();
    
    if (!user || !token) {
      // 🔥 Trigger a global event instead of throwing error
      window.dispatchEvent(new Event("openLoginModal"));
           return {
        status: "FAILED",
        message: "Login Required"
      };
    }
    
    const requestData = {
      bookId: bookId,
      user: user,
      token: token
    };
    
    const response = await axios.post(`${CART_ITEM_ADD_URL}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 🔥 Dispatch cartUpdated event after successful addition
    if (response.data && response.data.status === 'SUCCESS') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

export { addItemToCart };