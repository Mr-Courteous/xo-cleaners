// const baseURL = 'https://xo-cleaners.onrender.com'
const baseURL = 'http://localhost:8001';

// In your frontend source code
// const baseURL = "";
// export default baseURL;


// const baseURL = 'http://xocleaners.com:3001';


const baseURL = import.meta.env.VITE_API_BASE_URL;

export default baseURL;