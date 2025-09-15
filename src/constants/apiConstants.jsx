export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


//Auth
export const LOGIN_URL = `${API_BASE_URL}/user/login`;
export const REGISTER_URL = `${API_BASE_URL}/user/register`;

//Landing
export const BOOK_FETCH_URL = `${API_BASE_URL}/landing/bookList`;
export const BOOK_IMAGE_FETCH_URL = `${API_BASE_URL}/landing/book/image`;

export const CATRGORY_FETCH_URL = `${API_BASE_URL}/landing/categories`;


export const CART_VIEW_URL = `${API_BASE_URL}/cart/view`;
export const CART_ITEM_ADD_URL = `${API_BASE_URL}/cart/addItem`;

export const CART_ITEM_QUANTITY_URL = `${API_BASE_URL}/cart/quantity/update`;
export const CART_ITEM_DELETE_URL = `${API_BASE_URL}/cart/item/delete`;


export const CART_ITEM_URL = `${API_BASE_URL}/cart/cartItems`;

export const DISCOVERY_IMAGES = `${API_BASE_URL}/landing/images`;

export const ADD_DISCOVERY_IMAGE = `${API_BASE_URL}/book/discovery/addImage`;

export const VIEW_IMAGE = `${API_BASE_URL}/book/discovery/view/image`;
export const VIEW_DISCOVERY_IMAGE_LIST = `${API_BASE_URL}/book/discovery/viewAll`;
export const DELETE_DISCOVERY_IMAGE_LIST = `${API_BASE_URL}/book/discovery/deleteImage`;



export const BOOK_ADD_URL = `${API_BASE_URL}/book/addBook`;
export const BOOK_CATEGORIES_FETCH_URL = `${API_BASE_URL}/book/categories`;
export const BOOK_CATEGORIES_ADD_URL = `${API_BASE_URL}/book/category/add`;

export const FIND_ALL_BOOK_URL = `${API_BASE_URL}/book/findAllBook`;
export const BOOK_UPDATE_PRIORITY = `${API_BASE_URL}/book/update/priority`;
export const BOOK_UPDATE = `${API_BASE_URL}/book/update/information`;



export const CHECKOUT_CART_URL = `${API_BASE_URL}/order/create/cart`;

export const BOOK_INFORMATION_URL = `${API_BASE_URL}/order/getBookInformation`;
export const BOOK_CHECKOUT_URL = `${API_BASE_URL}/order/create/order/book`;


export const INVOICE_ADMIN_FETCH_URL = `${API_BASE_URL}/invoice/findAllInvoice`;


export const UPDATE_PAYMENT_URL = `${API_BASE_URL}/invoice/payment/paid/updateStatus`;
export const UPDATE_ORDER_STATUS_URL = `${API_BASE_URL}/invoice/order/updateStatus`;