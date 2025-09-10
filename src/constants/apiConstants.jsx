export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_MANAGER_URL = `${API_BASE_URL}/manager`;
export const API_BASE_INSTRUCTOR_URL = `${API_BASE_URL}/instructor`;
export const API_BASE_TRAINEE_URL = `${API_BASE_URL}/trainee`;
export const API_BASE_OPERATOR_URL = `${API_BASE_URL}/operator`;
export const API_BASE_COMMON_URL = `${API_BASE_URL}/common`;
export const API_BASE_PUBLIC_URL = `${API_BASE_URL}/public`;

//Auth
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const REGISTER_URL = `${API_BASE_URL}/auth/register`;

//Landing
export const LANDING_STATS_URL = `${API_BASE_PUBLIC_URL}/landing/stats`;
export const LANDING_COURSES_URL = `${API_BASE_PUBLIC_URL}/landing/courseList`;
export const LANDING_FAQ_URL = `${API_BASE_PUBLIC_URL}/landing/FaqQuestions`;
export const LANDING_COMBOPACK_URL = `${API_BASE_PUBLIC_URL}/landing/courseComboList`;
