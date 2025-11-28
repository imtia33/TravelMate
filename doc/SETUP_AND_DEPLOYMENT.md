# Setup and Deployment Guide

## Prerequisites

Before setting up the TravX application, ensure you have the following installed:

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Expo CLI**
4. **Git**

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/imtia33/TravX.git
cd TravX
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Google Maps API Key (required for map preview, dev build or production)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Appwrite Configuration (if using custom Appwrite instance)
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_project_id
```

Note: The Google Maps API key is only required for preview, development builds, or production builds. It's not needed for Expo Go development.

## Development Workflow

### Running the Application

1. **Start the Development Server**
   ```bash
   expo start
   ```
   or
   ```bash
   npm start -c
   ```

2. **Testing on Physical Device**
   - Install the Expo Go app from your device's app store
   - Scan the QR code displayed in the terminal

3. **Testing on Emulator/Simulator**
   - For Android: `expo run:android`
   - For iOS: `expo run:ios`

### Project Structure

```
TravX/
├── app/                 # Main application screens and navigation
├── components/          # Reusable UI components
├── constants/           # Constants like colors, icons, themes
├── context/             # React context providers
├── lib/                 # Business logic and utility functions
├── assets/              # Images, fonts, and other static assets
├── doc/                 # Documentation files
├── app.json             # Expo configuration
├── package.json         # Project dependencies and scripts
└── README.md            # Project overview
```

## Building for Production

### Android Build

1. **Configure app.json for Android**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.travx",
         "config": {
           "googleMaps": {
             "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
           }
         }
       }
     }
   }
   ```

2. **Build the Application**
   ```bash
   expo build:android
   ```

### iOS Build

1. **Configure app.json for iOS**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.travx"
       }
     }
   }
   ```

2. **Build the Application**
   ```bash
   expo build:ios
   ```

### Web Build

```bash
expo build:web
```

## Deployment

### Deploying to App Stores

1. **Generate Standalone Builds**
   - Use Expo's build services or configure local builds

2. **App Store Submission**
   - For iOS: Submit through Apple App Store Connect
   - For Android: Submit through Google Play Console

### Deploying to Expo Hosting

```bash
expo publish
```

### Deploying Web Version

1. **Build the Web Application**
   ```bash
   expo build:web
   ```

2. **Deploy to Hosting Service**
   - Upload the contents of the `web-build` directory to your hosting provider

## Database Setup

The TravX application uses a local SQLite database for route information. The database is pre-populated with route data.

### Database Schema

The application expects a SQLite database named `routes.db` with the following tables:

1. **routes**
   ```sql
   CREATE TABLE routes (
     "From" TEXT,
     "To" TEXT,
     "Vehicles" TEXT,
     "distanceKm" REAL
   );
   ```

2. **Fare**
   ```sql
   CREATE TABLE Fare (
     "Vehicle" TEXT,
     "base_fare" REAL,
     "cost_per_km" REAL,
     "minimum_fare" REAL
   );
   ```

### Populating the Database

To populate the database with route information:

1. Create the SQLite database file
2. Execute the schema creation SQL statements
3. Insert route data using INSERT statements

Example:
```sql
INSERT INTO routes VALUES 
('Dhaka', 'Chittagong', '[Bus, Train]', 245.5),
('Dhaka', 'Sylhet', '[Bus, Car]', 210.3);
```

## API Key Setup

### Google Maps API Key

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Maps JavaScript API
4. Generate an API key
5. Add the key to your `.env` file or app.json

### Photon API

The Photon API is used for geocoding and does not require an API key. It's accessed directly through HTTP requests.

### Appwrite Configuration

If using a custom Appwrite instance:

1. Set up an Appwrite server
2. Create a new project
3. Configure the required collections
4. Add the endpoint and project ID to your configuration

## Customization

### Changing the Default Location

To change the default location, modify the user context in `context/GlobalProvider.js`:

```javascript
const initialUser = {
  Lat: YOUR_DEFAULT_LATITUDE,
  Long: YOUR_DEFAULT_LONGITUDE,
  District: "YOUR_DEFAULT_DISTRICT"
};
```

### Route Preferences

To customize route preferences, modify the pathfinding functions in `lib/pathfinder.js`:

1. Adjust the `MAX_DISTANCE_DIFFERENCE` constant to control route diversity
2. Modify the fare calculation algorithm in the `fare` function
3. Update the vehicle types in the database

### Map Settings

To customize Google Maps settings, modify the MapView component in `app/(tabs)/route.jsx`:

```javascript
<MapView
  mapType={state.mapType} // "standard" or "hybrid"
  showsTraffic={true}
  showsBuildings={true}
/>
```

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check Google Maps API key configuration
   - Verify internet connectivity
   - Ensure the API key has the correct permissions

2. **Location Services Not Working**
   - Check device location permissions
   - Ensure location services are enabled
   - Verify Expo location permissions in app.json

3. **Database Errors**
   - Verify the routes.db file exists in the correct location
   - Check database schema matches expected structure
   - Ensure database file has read permissions

4. **Build Failures**
   - Check all dependencies are correctly installed
   - Verify app.json configuration is valid
   - Ensure all required assets are present

### Debugging Tips

1. **Enable Debug Mode**
   ```bash
   expo start --dev-client
   ```

2. **Clear Cache**
   ```bash
   expo start -c
   ```

3. **Check Logs**
   ```bash
   expo logs
   ```

## Maintenance

### Updating Dependencies

Regularly update dependencies to ensure security and performance:

```bash
npm update
```

or

```bash
yarn upgrade
```

### Database Updates

To update route information:

1. Backup the existing database
2. Update the routes.db file with new data
3. Test the application with the updated database

### Monitoring

Implement monitoring for:

1. API usage and quotas
2. Application crashes and errors
3. User engagement metrics
4. Performance metrics

This guide provides a comprehensive overview of setting up, building, and deploying the TravX application. Following these steps will help ensure a successful implementation and deployment of the smart route planning application.