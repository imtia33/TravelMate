
# 🚗 TravX - Smart Route Planner

TravX is a **modern mobile application** designed to simplify your travel experience. Whether you're commuting to work, exploring a new city, or planning a road trip, TravX helps you find the **most efficient routes** from your current location to your destination. With seamless integration of **Google Maps** and **Photon**, the app offers **real-time route optimization**, **interactive maps**, and **offline route-saving capabilities**.

---

## ✨ Key Features

- **🚦 Route Optimization**: Calculate the most efficient routes based on distance, time, and traffic conditions.
- **🗺️ Interactive Maps**: Explore routes with zoom, pan, and multi-touch gestures.
- **🔢 Multiple Route Options**: Choose from up to 3 distinct routes tailored to your preferences.
- **📴 Offline Mode**: Save your favorite routes for offline access—perfect for areas with limited connectivity.
- **🔍 Smart Search**: Find locations quickly with real-time suggestions powered by Photon.
- **🌍 Customizable Map Layers**: Switch between **standard** and **hybrid** map views for a personalized experience.
- **📍 Real-Time Tracking**: Track your location and heading in real-time with smooth animations.
- **👀 Route Preview**: Preview your route in **Google Maps WebView** before starting your journey.

---

## 🛠️ Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **Expo CLI** (`npm install -g expo-cli`)
- **Yarn** or **npm**

### Steps to Get Started
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/TravX.git
   cd TravX
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add your API keys:
     ```bash
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     PHOTON_API_KEY=your_photon_api_key
     ```

4. **Run the App**:
   ```bash
   expo start
   ```
   - Use the **Expo Go** app on your phone to test the app, or run it on an **Android/iOS emulator**.

---

## ⚙️ Configuration

Customize the app to suit your needs by modifying the `config.js` file. Key configurations include:

- **Default Location**: Set a default starting point for users.
- **Route Preferences**: Prioritize **speed** or **distance** for route calculations.
- **WebView Settings**: Customize the Google Maps preview display.

Example `config.js`:
```javascript
export default {
  defaultLocation: { latitude: 23.8103, longitude: 90.4125 }, // Dhaka, Bangladesh
  routePreference: 'distance', // 'speed' or 'distance'
  webViewSettings: {
    zoomLevel: 15,
    mapType: 'standard',
  },
};
```

---

## 🚀 Usage

### 1. **Get Directions**
   - Enter your destination in the search bar.
   - The app will calculate the most efficient route from your current location.

### 2. **View Route Options**
   - The app displays up to **3 distinct routes** with **distance** and **fare information**.
   - Tap on a route to view it on the map.

### 3. **Interactive Features**
   - **Zoom in/out** and **pan** the map to explore alternative routes.
   - Tap the **"Preview"** button to open the route in **Google Maps WebView**.

### 4. **Save Routes for Offline Use**
   - Save frequently traveled routes for **offline access**.

### 5. **Real-Time Tracking**
   - Enable **real-time location tracking** to follow your progress on the map.

---

## 🔑 API Key Setup

To use **Google Maps** and **Photon** services, you need to obtain API keys:

1. **Google Maps API Key**:
   - Visit the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project and enable the **Google Maps JavaScript API**.
   - Generate an API key and add it to your `.env` file.

2. **Photon API Key**:
   - Visit the [Photon Documentation](https://photon.komoot.io/) for API key instructions.
   - Add the key to your `.env` file.

Example `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
PHOTON_API_KEY=your_photon_api_key
```

---

## 🤝 Contributing

We welcome contributions from the community! Here’s how you can help:

1. **Fork the Repository**:
   ```bash
   git clone https://github.com/your-username/TravX.git
   cd TravX
   ```

2. **Create a New Branch**:
   ```bash
   git checkout -b feature-name
   ```

3. **Make Your Changes**:
   - Ensure your code follows the existing style and is well-documented.
   - Write tests for new features whenever possible.

4. **Commit and Push**:
   ```bash
   git commit -am 'Add new feature'
   git push origin feature-name
   ```

5. **Open a Pull Request**:
   - Submit your changes for review.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- **Google Maps**: For map rendering and geolocation.
- **OpenStreetMap**: For providing open-source map data.
- **Photon**: For geocoding and search functionality.
- **Expo**: For providing an easy-to-use development environment.

---

Made with ❤️ by [Your Name](https://github.com/your-username).
