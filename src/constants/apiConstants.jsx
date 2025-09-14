export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


//Auth
export const LOGIN_URL = `${API_BASE_URL}/user/login`;
export const REGISTER_URL = `${API_BASE_URL}/user/register`;

//Landing
export const BOOK_FETCH_URL = `${API_BASE_URL}/landing/bookList`;
export const CATRGORY_FETCH_URL = `${API_BASE_URL}/landing/categories`;


export const CART_VIEW_URL = `${API_BASE_URL}/cart/view`;
export const CART_ITEM_ADD_URL = `${API_BASE_URL}/cart/addItem`;

export const CART_ITEM_QUANTITY_URL = `${API_BASE_URL}/cart/quantity/update`;
export const CART_ITEM_DELETE_URL = `${API_BASE_URL}/cart/item/delete`;


export const DISCOVERY_IMAGES = `${API_BASE_URL}/landing/images`;

export const BOOK_ADD_URL = `${API_BASE_URL}/book/addBook`;
export const BOOK_CATEGORIES_FETCH_URL = `${API_BASE_URL}/book/categories`;



