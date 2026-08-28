import { AlertRepository } from './AlertRepository';
import { PortfolioRepository } from './PortfolioRepository';
import { PreferencesRepository } from './PreferencesRepository';
import { RecentSearchRepository } from './RecentSearchRepository';
import { RecentlyViewedRepository } from './RecentlyViewedRepository';
import { WatchlistRepository } from './WatchlistRepository';

export const watchlistRepository = new WatchlistRepository();
export const portfolioRepository = new PortfolioRepository();
export const holdingRepository = portfolioRepository;
export const alertRepository = new AlertRepository();
export const recentSearchRepository = new RecentSearchRepository();
export const recentlyViewedRepository = new RecentlyViewedRepository();
export const preferencesRepository = new PreferencesRepository();
