import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
});
export const logChange = async (userEmail: string, action: string, changeDetails: string) => {
  console.log(`API call to log change: ${action} - ${changeDetails} for user: ${userEmail}`);
  console.log(`API URL: ${API_BASE_URL}/change-log`);
  
  try {
    const response = await api.post('/change-log', {
      userEmail: userEmail,
      action,
      changeDetails: { description: changeDetails }
    });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error logging change:', error);
    throw error;
  }
};

export const fetchLatestLogs = async (limit: number | null = 25) => {
  try {
    // If limit is null, don't pass a limit parameter to get all logs
    const url = limit === null ? '/change-log' : `/change-log?limit=${limit}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};
