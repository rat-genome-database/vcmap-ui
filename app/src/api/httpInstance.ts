import Axios from 'axios';
import config from '@/../config/app.config';
import logger from '@/logger';

if (!config.API_BASE_URL)
{
  logger.warn('API_BASE_URL is not defined in your app configuration');
}

const axiosInstance = Axios.create({
  baseURL: config.API_BASE_URL
});

export default axiosInstance;