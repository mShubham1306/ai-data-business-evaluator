export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any)['NOVA_API_URL'])
    ? (window as any)['NOVA_API_URL']
    : 'https://ai-data-business-evaluator.onrender.com/api'
};
