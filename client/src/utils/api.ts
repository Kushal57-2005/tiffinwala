import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://tiffinwala-kjfo.onrender.com/api/',
    withCredentials: true,
});
