import Axios from 'axios';

const axiosInstance = Axios.create({
  baseURL: 'https://rest.rgd.mcw.edu/rgdws'
});

export default axiosInstance;