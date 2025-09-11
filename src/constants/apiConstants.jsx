export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


//Auth
export const LOGIN_URL = `${API_BASE_URL}/user/login`;
export const REGISTER_URL = `${API_BASE_URL}/user/register`;

//Landing
export const BOOK_FETCH_URL = `${API_BASE_URL}/landing/bookList`;
export const CATRGORY_FETCH_URL = `${API_BASE_URL}/landing/categories`;


export const CART_VIEW_URL = `${API_BASE_URL}/cart/view`;
