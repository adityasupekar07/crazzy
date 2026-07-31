const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

export async function request<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' = 'GET',
  body?: any
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const text = await response.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw new Error(`Server returned error (${response.status}): ${response.statusText || 'Invalid response'}`);
    }
    throw new Error('Invalid JSON format returned from server');
  }

  if (!response.ok) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}
