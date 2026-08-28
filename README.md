# PocketTicker

<p align="center">
  <strong>Modern Android Market Intelligence Application Built with React Native & TypeScript</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.87.0-61DAFB?logo=react&logoColor=black" alt="React Native 0.87.0" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=black" alt="React 19.2.3" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Android-API_24+-3DDC84?logo=android&logoColor=white" alt="Android API 24+" />
  <img src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions CI" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 📌 Project Overview & Purpose

**PocketTicker** is an engineering portfolio project demonstrating the design and implementation of a production-style, offline-first mobile application on Android. It highlights real-world mobile engineering practices, including native module integrations, persistent domain repositories, server-state synchronization with offline fallback, Android Keystore-backed biometric/device authentication, background alert tasks, accessibility, and strict automated testing.

Its product scope is intentionally trading-adjacent: asset discovery and sorting, detailed price/chart exploration, watchlists, alerts, and simulated portfolio monitoring, without executing trades or handling funds.

> ⚠️ **Portfolio Project Notice**: PocketTicker is an educational market intelligence and tracking demonstration. It **does not support real trading, crypto wallets, funds custody, brokerage accounts, or real financial transactions**. All portfolio tracking is strictly simulated with local data.

**Verified Android build:** successfully assembled and launched on a Pixel 10 Pro API 37 emulator with React Native 0.87, Gradle 9.4.1, Kotlin 2.2.0, and JDK 21.

## 📱 Screenshots

<p align="center">
  <img src="docs/screenshots/01_markets_screen.png" width="260" alt="PocketTicker markets screen" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/02_asset_details.png" width="260" alt="PocketTicker asset details and interactive chart" />
</p>

<p align="center">
  <img src="docs/screenshots/04_search_screen.png" width="260" alt="PocketTicker asset search" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/06_portfolio_screen.png" width="260" alt="PocketTicker simulated portfolio" />
</p>

The UI is built as a native React Native Android experience with responsive layouts, accessible controls, dark/light/system themes, and clear loading, empty, offline, and error states.

---

## ✨ Features

- **📊 Real-Time & Historical Market Intelligence**:
  - Live price feeds, 24-hour price change percentage, volume, market capitalization, circulating supply, and all-time statistics.
  - Interactive SVG price chart with multi-timeframe switching (`1D`, `7D`, `30D`, `90D`, `1Y`) and touch scrubbing to inspect specific timestamp values.
  - Fast sorting by market cap, price, top gainers, and top losers.

- **⭐ Local Watchlist & Sorting**:
  - Persistent watchlist backed by local storage.
  - Custom list reordering with single-tap up/down movement and fast removal.

- **💼 Simulated Portfolio & Privacy Mode**:
  - Track simulated holdings without wallet connection or custody risk.
  - Dynamic portfolio valuation, asset allocation percentages, and calculated gain/loss metrics.
  - **Privacy Mode (Hide Balances)**: Instant masking of values (`••••••`) across all portfolio and market screens.

- **🔔 Opportunistic Price Alerts & Notifications**:
  - Configure directional alerts (price rises above / price falls below target).
  - Dedicated Android notification channel (`price-alerts`) with high priority heads-up notifications.
  - Background alert evaluations via Android `JobScheduler` (`react-native-background-fetch`) and headless task execution upon boot and app wake.

- **🛡️ Biometric & Device Credential App Lock**:
  - Android Keystore-backed biometric/device authentication (Fingerprint, Face, or Device Passcode) via `react-native-keychain`.
  - Secure sentinel storage: protected key retrieval prevents exposing balances or sensitive screens until authentication succeeds.
  - `StartupGate` architecture: zero flashing of protected content during app launch or cold resume.

- **🔍 Debounced Market Search & History**:
  - Instant debounced asset search across symbols and names.
  - Persistent recent search terms and recently viewed asset carousels.

- **🌐 Offline-First Architecture**:
  - Full TanStack React Query cache persisted locally to AsyncStorage.
  - Persistent cached state restored on cold startup with stale data indicators and offline banners.
  - Automatic background refetching and recovery when connectivity is restored (`@react-native-community/netinfo`).

- **🎨 Multi-Theme & Currency Localization**:
  - Dark, Light, and System appearance modes with high-contrast, accessible palettes.
  - Multi-currency support: `CAD`, `USD`, `EUR`, and `GBP` with formatted localized display.

- **🔗 Deep Linking**:
  - Native intent filter and URL routing for `pocketticker://asset/:assetId`.

- **🛠️ Diagnostics & Non-Invasive Analytics**:
  - Built-in runtime diagnostic dashboard for development builds (active cache count, network state, notification permissions, biometric capability).
  - Abstracted privacy-first analytics pipeline with sensitive financial masking.

---

## 🏗️ Architecture & Technology Stack

```
PocketTicker Architecture:
┌────────────────────────────────────────────────────────┐
│                      UI Layer                          │
│  React Navigation (Native Stack + Bottom Tabs)         │
│  Theme Context (Light / Dark / System)                 │
│  Accessible Components & Native SVG Charts            │
└──────────────────────────┬─────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     Server State Layer       │ │      Local State Layer       │
│  TanStack React Query        │ │  Zustand Preferences Store   │
│  AsyncStorage Persister      │ │  Zustand Snackbar Store      │
│  NetInfo Connectivity Sync   │ │  Biometric Service / Gate    │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│     Market Data Layer        │ │     Repository Layer         │
│  MarketDataProvider Interface│ │  WatchlistRepository         │
│  ├── MockMarketDataProvider  │ │  PortfolioRepository         │
│  └── CoinGeckoProvider (Zod) │ │  AlertRepository             │
│  HTTP Client + Retry Policy  │ │  PreferencesRepository       │
└──────────────────────────────┘ └──────────────────────────────┘
```

### Core Technologies

| Area | Technology |
|---|---|
| Mobile | React Native 0.87 |
| Language | TypeScript (strict) |
| UI | React 19, React Navigation, React Native SVG |
| Server state | TanStack React Query |
| Client state | Zustand |
| Persistence | AsyncStorage, React Query persisted cache |
| Validation | Zod |
| Native security | react-native-keychain |
| Notifications | Notifee |
| Background work | react-native-background-fetch |
| Connectivity | @react-native-community/netinfo |
| Testing | Jest, React Native Testing Library |
| CI | GitHub Actions |

---

## 📂 Project Structure

```text
PocketTicker/
├── android/                       # Native Android Gradle project
├── ios/                           # React Native iOS project scaffold
├── src/
│   ├── api/                       # Market provider contracts, clients, schemas, mappers
│   ├── components/                # Reusable UI components
│   ├── config/                    # App metadata/configuration
│   ├── features/                  # Feature-oriented screens and logic
│   │   ├── alerts/
│   │   ├── asset/
│   │   ├── markets/
│   │   ├── portfolio/
│   │   ├── search/
│   │   ├── security/
│   │   ├── settings/
│   │   └── watchlist/
│   ├── navigation/                # Stack/tab navigation and deep links
│   ├── repositories/              # Persistent domain repositories
│   ├── services/                  # Analytics, alerts, biometrics, notifications
│   ├── store/                     # Global app/UI state
│   ├── theme/                     # Theme tokens and provider
│   ├── types/                     # Shared domain models
│   └── utils/                     # Formatting/calculation helpers
├── __tests__/                     # Unit/component/workflow tests
├── docs/screenshots/              # Portfolio screenshots
├── .github/workflows/ci.yml       # CI validation and Android build
└── README.md
```

---

## 🚀 Running Locally

### Requirements

- **Node.js** 20.19+ (Node 22 recommended)
- **npm**
- **Android Studio**: Android SDK (min API 24, compile API 37, target API 36), Android NDK `27.1.12297006`, and JDK 21

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and choose the data provider:

```env
MARKET_DATA_PROVIDER=mock
COINGECKO_API_KEY=
```

Mock mode is credential-free and gives reviewers a deterministic demo experience. CoinGecko mode can be enabled for live data.

### Start Metro

```bash
npm start
```

### Run Android

From another terminal:

```bash
npm run android
```

Or open `android/` in Android Studio, allow Gradle to sync, select an emulator/device, and run the `app` configuration.

---

## ✅ Verification

```bash
npm run lint
npm run typecheck
npm test
```

Android debug build:

```bash
cd android
./gradlew assembleDebug
```

On Windows:

```powershell
cd android
.\gradlew.bat assembleDebug
```

The GitHub Actions workflow runs dependency installation, linting, type checking, tests, and a debug Android build on pushes and pull requests to `main`.

---

## 🔐 Security & Privacy Notes

- No real trading credentials, private keys, exchange credentials, wallet seeds, or brokerage connections exist in this project.
- Secrets are never committed to source control; `.env` is ignored and `.env.example` documents expected variables.
- Biometric/device authentication is backed by Android Keystore access controls through `react-native-keychain`.
- Privacy Mode masks displayed balances and values without pretending to provide financial custody.
- API responses are schema-validated before entering application domain models.

---

## ⚠️ Practical Limitations

- CoinGecko's free/public access can be rate-limited or temporarily unavailable.
- Android background execution is opportunistic. The operating system may defer jobs under battery optimization, Doze, or vendor-specific background restrictions.
- Price alerts therefore demonstrate Android background-task architecture; they are not marketed as guaranteed real-time financial alerts.
- The portfolio is simulated and stored locally.
- There is no order routing, execution engine, exchange connectivity, wallet custody, or money movement.

---

## 🧪 Portfolio Focus

PocketTicker was built to demonstrate hands-on React Native engineering rather than to imitate a production financial institution. The project emphasizes:

- native Android integration
- TypeScript architecture
- responsive financial UI
- API/provider abstraction
- runtime validation
- offline persistence
- state ownership boundaries
- background work and notifications
- biometric security
- automated testing
- CI/CD discipline
- maintainable, inspectable code

---

## 📄 License

MIT License. See [`LICENSE`](LICENSE).
