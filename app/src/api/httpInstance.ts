import Axios from 'axios';
import config from '@/../config/app.config';

if (!config.API_BASE_URL)
{
  console.warn('API_BASE_URL is not defined in your app configuration');
}

const axiosInstance = Axios.create({
  baseURL: config.API_BASE_URL
});

export default axiosInstance;