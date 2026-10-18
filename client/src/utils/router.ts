// Client-side router for URL synchronization, browser navigation (popstate),
// and page state mappings without extra dependencies.

export interface RouteState {
  page: string;
  params: Record<string, any>;
  path: string;
}

// Parse window.location into page and params
export function parseLocation(pathname: string, search: string): RouteState {
  // Normalize pathname: remove trailing slash unless it's just "/"
  let cleanPath = pathname.trim();
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // Parse query parameters
  const searchParams = new URLSearchParams(search);
  const queryParams: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    // Avoid storing sensitive or internal parameters in URL state
    if (!['password', 'token', 'secret', 'cvv', 'cardNumber'].includes(key)) {
      queryParams[key] = value;
    }
  });

  // 1. Homepage
  if (cleanPath === '' || cleanPath === '/') {
    return { page: 'home', params: queryParams, path: '/' };
  }

  // 2. Fleet Catalogue
  if (cleanPath === '/catalogue' || cleanPath === '/fleet') {
    return { page: 'catalogue', params: queryParams, path: cleanPath };
  }

  // 3. Vehicle Details: /vehicles/:id or /catalogue/:id or /vehicle/:id
  const vehicleMatch = cleanPath.match(/^\/(?:vehicles|vehicle|catalogue)\/(\d+)$/i);
  if (vehicleMatch) {
    const vehicleId = parseInt(vehicleMatch[1], 10);
    return {
      page: 'vehicle-details',
      params: { ...queryParams, vehicleId },
      path: cleanPath
    };
  }

  // 4. About Us
  if (cleanPath === '/about' || cleanPath === '/about-us') {
    return { page: 'about', params: queryParams, path: '/about' };
  }

  // 5. Rental Terms & Policies
  if (cleanPath === '/terms' || cleanPath === '/terms-and-conditions' || cleanPath === '/policy') {
    return { page: 'terms', params: queryParams, path: '/terms' };
  }

  // 6. Contact & Support
  if (cleanPath === '/contact' || cleanPath === '/contact-us') {
    return { page: 'contact', params: queryParams, path: '/contact' };
  }

  // 7. Driving Guides / Blog List
  if (cleanPath === '/blog' || cleanPath === '/guides') {
    return { page: 'blog', params: queryParams, path: '/blog' };
  }

  // 8. Blog Article Reader: /blog/:slug
  const blogMatch = cleanPath.match(/^\/blog\/([a-zA-Z0-9_-]+)$/i);
  if (blogMatch) {
    return {
      page: 'blog-post',
      params: { ...queryParams, slug: blogMatch[1] },
      path: cleanPath
    };
  }

  // 9. Authentication
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { page: 'login', params: queryParams, path: '/login' };
  }
  if (cleanPath === '/register' || cleanPath === '/signup') {
    return { page: 'register', params: queryParams, path: '/register' };
  }
  if (cleanPath === '/forgot-password' || cleanPath === '/reset-password') {
    return { page: 'forgot-password', params: queryParams, path: '/forgot-password' };
  }

  // 10. Role-based Dashboards
  if (cleanPath === '/customer/dashboard' || cleanPath === '/dashboard' || cleanPath === '/customer') {
    return { page: 'customer-dashboard', params: queryParams, path: '/customer/dashboard' };
  }
  if (cleanPath === '/staff/dashboard' || cleanPath === '/staff') {
    return { page: 'staff-dashboard', params: queryParams, path: '/staff/dashboard' };
  }
  if (cleanPath === '/admin/dashboard' || cleanPath === '/admin') {
    return { page: 'admin-dashboard', params: queryParams, path: '/admin/dashboard' };
  }

  // 11. Unmatched / Unknown route
  return {
    page: 'not-found',
    params: { requestedPath: cleanPath, ...queryParams },
    path: cleanPath
  };
}

// Convert page identifier and parameters into clean URL path
export function formatUrl(pageOrPath: string, params: Record<string, any> = {}): string {
  // If an absolute URL or path starting with '/' was passed directly, preserve it
  if (pageOrPath.startsWith('/')) {
    const qs = buildSafeQueryString(params);
    return qs ? `${pageOrPath}${pageOrPath.includes('?') ? '&' : '?'}${qs}` : pageOrPath;
  }

  switch (pageOrPath) {
    case 'home':
      return '/';

    case 'catalogue': {
      const safeParams: Record<string, any> = {};
      if (params.category && params.category !== 'all') safeParams.category = params.category;
      if (params.pickupDate) safeParams.pickupDate = params.pickupDate;
      if (params.returnDate) safeParams.returnDate = params.returnDate;
      if (params.pickupLocation) safeParams.pickupLocation = params.pickupLocation;
      const qs = buildSafeQueryString(safeParams);
      return qs ? `/catalogue?${qs}` : '/catalogue';
    }

    case 'vehicle-details':
      if (params.vehicleId) {
        return `/vehicles/${params.vehicleId}`;
      }
      return '/catalogue';

    case 'about':
      return '/about';

    case 'terms':
      return '/terms';

    case 'contact':
      return '/contact';

    case 'blog':
      return '/blog';

    case 'blog-post':
      if (params.slug) {
        return `/blog/${encodeURIComponent(params.slug)}`;
      }
      return '/blog';

    case 'login':
      return '/login';

    case 'register':
      return '/register';

    case 'forgot-password':
      return '/forgot-password';

    case 'customer-dashboard':
      return '/customer/dashboard';

    case 'staff-dashboard':
      return '/staff/dashboard';

    case 'admin-dashboard':
      return '/admin/dashboard';

    default:
      return `/${encodeURIComponent(pageOrPath)}`;
  }
}

// Build query string, omitting internal routing keys
function buildSafeQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      typeof value !== 'function' &&
      !['vehicleId', 'slug', 'requestedPath'].includes(key)
    ) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}
