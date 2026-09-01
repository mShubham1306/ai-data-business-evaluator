const getProdApiUrl = (): string => {
  const rawUrl = (typeof window !== 'undefined' && (window as any)['NOVA_API_URL'])
    ? (window as any)['NOVA_API_URL']
    : 'https://ai-data-business-evaluator.onrender.com/api';
  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

export const environment = {
  production: true,
  apiUrl: getProdApiUrl()
};
