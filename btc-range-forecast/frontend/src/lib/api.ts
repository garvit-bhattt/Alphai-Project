import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
});

export interface PredictionResponse {
  current_price: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface MetricsResponse {
  coverage: number;
  avg_width: number;
  winkler: number;
}

export interface HistoryItem {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PredictionHistoryItem {
  created_at: string;
  candle_time: string;
  current_price: number;
  lower: number;
  upper: number;
  width?: number;
  actual: number | null;
  hit: boolean | null;
}

export interface PriceResponse {
  price: number;
  hour: number;
}

export const getPrediction = async (): Promise<PredictionResponse> => {
  const response = await client.get('/predict');
  return response.data;
};

export const getMetrics = async (): Promise<MetricsResponse> => {
  const response = await client.get('/metrics');
  return response.data;
};

export const getHistory = async (interval: string = "1h"): Promise<HistoryItem[]> => {
  const response = await client.get(`/history?interval=${interval}`);
  return response.data;
};

export const getPredictionHistory = async (): Promise<PredictionHistoryItem[]> => {
  const response = await client.get('/prediction-history');
  return response.data;
};

export const getPrice = async (): Promise<PriceResponse> => {
  const response = await client.get('/price');
  return response.data;
};
