
# TravelMate - Route Planner App

TravelMate is a mobile application designed to help users find the most efficient routes from their current location to a specified destination. The app integrates with **Google Maps** and **Photon** for geolocation and geocoding services, providing users with multiple route options, interactive maps, and offline route-saving capabilities.

## Features
- **Route Planning**: Calculate the most efficient routes from your current location to a destination.
- **Interactive Maps**: Zoom, pan, and interact with the map to explore alternative routes.
- **Multiple Route Options**: View up to 3 distinct routes based on distance and efficiency.
- **Offline Mode**: Save frequently traveled routes for offline use.
- **Search Functionality**: Search for locations and get real-time suggestions.
- **Customizable Map Layers**: Switch between standard and hybrid map views.
- **Real-Time Location Tracking**: Track your location and heading in real-time.
- **Route Preview**: Preview routes using Google Maps WebView before starting your journey.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- Yarn or npm

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/travelmate.git
   cd travelmate
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your API keys:
     ```bash
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     PHOTON_API_KEY=your_photon_api_key
     ```

4. Run the app:
   ```bash
   expo start
   ```
   - Use the Expo Go app on your phone to test the app, or run it on an Android/iOS emulator.

## Configuration

You can customize the app by modifying the `config.js` file. Key configurations include:

- **Default Location Settings**: Set a default starting point for users.
- **Route Preferences**: Prioritize speed or distance for route calculations.
- **WebView Settings**: Customize how the Google Maps preview is displayed.

Example:
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

## Usage

1. **Get Directions**:
   - Enter your destination in the search bar.
   - The app will calculate the most efficient route from your current location.

2. **View Route Options**:
   - The app displays up to 3 distinct routes with distance and fare information.
   - Tap on a route to view it on the map.

3. **Interactive Features**:
   - Zoom in/out and pan the map to explore alternative routes.
   - Tap the "Preview" button to open the route in Google Maps WebView.

4. **Save Routes for Offline Use**:
   - Save frequently traveled routes for offline access.

5. **Real-Time Tracking**:
   - Enable real-time location tracking to follow your progress on the map.

## API Key Setup

To use Google Maps and Photon services, you need to obtain API keys:

1. **Google Maps API Key**:
   - Visit the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project and enable the Google Maps JavaScript API.
   - Generate an API key and add it to your `.env` file.

2. **Photon API Key**:
   - Visit the [Photon Documentation](https://photon.komoot.io/) for API key instructions.
   - Add the key to your `.env` file.

Example `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
PHOTON_API_KEY=your_photon_api_key
```

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make your changes and commit:
   ```bash
   git commit -am 'Add new feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

Please ensure your code follows the existing style and is well-documented. Write tests for new features whenever possible.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- **Google Maps**: For map rendering and geolocation.
- **OpenStreetMap**: For providing open-source map data.
- **Photon**: For geocoding and search functionality.
- **Expo**: For providing an easy-to-use development environment.

Made with ❤️ by [Your Name](https://github.com/your-username).
```
