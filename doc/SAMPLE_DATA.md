# Sample Data

## Database Schema and Sample Records

### Routes Table

The routes table contains precomputed route segments between different locations. Each record represents a direct connection between two points with associated transportation options and distance.

#### Schema

```sql
CREATE TABLE routes (
  "From" TEXT,
  "To" TEXT,
  "Vehicles" TEXT,
  "distanceKm" REAL
);
```

#### Sample Data

```sql
INSERT INTO routes VALUES 
('Dhaka', 'Gazipur', '[Bus, Car]', 32.5),
('Dhaka', 'Narayanganj', '[Bus, Launch]', 25.7),
('Dhaka', 'Mymensingh', '[Bus, Car]', 120.3),
('Gazipur', 'Jamalpur', '[Bus, Car]', 85.2),
('Narayanganj', 'Chandpur', '[Launch, Bus]', 45.8),
('Mymensingh', 'Netrokona', '[Bus, Car]', 65.4),
('Chittagong', 'Cox''s Bazar', '[Bus, Car]', 152.7),
('Chittagong', 'Rangamati', '[Bus, Car]', 95.6),
('Khulna', 'Jessore', '[Bus, Car]', 78.9),
('Khulna', 'Bagerhat', '[Bus, Car]', 110.2),
('Rajshahi', 'Bogra', '[Bus, Car]', 95.3),
('Rajshahi', 'Naogaon', '[Bus, Car]', 125.7),
('Sylhet', 'Sunamganj', '[Bus, Car]', 85.6),
('Sylhet', 'Moulvibazar', '[Bus, Car]', 65.4);
```

### Fare Table

The fare table contains pricing information for different transportation modes, including base fare, cost per kilometer, and minimum fare.

#### Schema

```sql
CREATE TABLE Fare (
  "Vehicle" TEXT,
  "base_fare" REAL,
  "cost_per_km" REAL,
  "minimum_fare" REAL
);
```

#### Sample Data

```sql
INSERT INTO Fare VALUES 
('Bus', 20.0, 5.0, 30.0),
('Car', 50.0, 15.0, 100.0),
('Launch', 30.0, 8.0, 50.0),
('Train', 25.0, 4.0, 40.0),
('Walk', 0.0, 0.0, 0.0);
```

## API Response Samples

### Photon API Responses

#### Location Search Response

```json
{
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          90.4125,
          23.8103
        ]
      },
      "properties": {
        "osm_id": 123456789,
        "osm_type": "N",
        "extent": [
          90.4120,
          23.8108,
          90.4130,
          23.8098
        ],
        "country": "Bangladesh",
        "osm_key": "place",
        "osm_value": "city",
        "name": "Dhaka",
        "state": "Dhaka Division"
      }
    }
  ]
}
```

#### Reverse Geocoding Response

```json
{
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          91.8317,
          22.3533
        ]
      },
      "properties": {
        "osm_id": 987654321,
        "osm_type": "N",
        "extent": [
          91.8312,
          22.3538,
          91.8322,
          22.3528
        ],
        "country": "Bangladesh",
        "osm_key": "place",
        "osm_value": "city",
        "name": "Chittagong",
        "state": "Chittagong Division",
        "postcode": "4000",
        "street": "Agrabad Commercial Area"
      }
    }
  ]
}
```

### Appwrite API Responses

#### User Authentication Response

```json
{
  "id": "654321abcdef",
  "email": "user@example.com",
  "name": "John Doe",
  "registration": "2023-01-15 10:30:00.000",
  "status": true,
  "passwordUpdate": "2023-01-15 10:30:00.000",
  "emailVerification": true,
  "prefs": {
    "theme": "dark",
    "notifications": true
  }
}
```

#### Document Query Response

```json
{
  "documents": [
    {
      "$id": "doc123456",
      "$collectionId": "places",
      "Name": "Ahsan Manzil",
      "District": "Dhaka",
      "Latitude": 23.7260,
      "Longitude": 90.4066,
      "Description": "Historical palace and museum",
      "Category": "Tourism"
    },
    {
      "$id": "doc789012",
      "$collectionId": "places",
      "Name": "Lalbagh Fort",
      "District": "Dhaka",
      "Latitude": 23.7190,
      "Longitude": 90.4093,
      "Description": "Mughal fort complex",
      "Category": "Tourism"
    }
  ],
  "total": 2
}
```

## Application State Examples

### Global Context State

```json
{
  "user": {
    "id": "654321abcdef",
    "email": "user@example.com",
    "username": "john_doe",
    "District": "Dhaka",
    "Lat": 23.8103,
    "Long": 90.4125,
    "bbox": "[90.35, 23.7, 90.5, 23.9]"
  },
  "historyPlaces": [
    {
      "Name": "Ahsan Manzil",
      "District": "Dhaka",
      "Latitude": 23.7260,
      "Longitude": 90.4066
    },
    {
      "Name": "Lalbagh Fort",
      "District": "Dhaka",
      "Latitude": 23.7190,
      "Longitude": 90.4093
    }
  ],
  "recentPlaces": [
    {
      "Name": "Star Kabab",
      "District": "Dhaka",
      "Latitude": 23.7500,
      "Longitude": 90.3900
    }
  ]
}
```

### Route Calculation State

```json
{
  "routeData": [
    [
      {
        "From": "Current Location",
        "To": "Ahsan Manzil",
        "Vehicle": "Walk",
        "distance": 0.5,
        "fare": 0
      },
      {
        "From": "Dhaka",
        "To": "Ahsan Manzil",
        "Vehicle": "Bus",
        "distance": 12.5,
        "fare": 82.5
      }
    ]
  ],
  "selectedRouteIndex": 0,
  "polylines": [
    [
      [90.4125, 23.8103],
      [90.4100, 23.8000],
      [90.4066, 23.7260]
    ]
  ],
  "roadDistance": [13.0],
  "currentDistance": 13.0
}
```

## Component Props Examples

### RouteDisplay Component Props

```jsx
<RouteDisplay 
  routeData={[
    {
      From: "Dhaka",
      To: "Ahsan Manzil",
      Vehicle: "Bus",
      distance: 12.5,
      fare: 82.5
    }
  ]}
  distance={13.0}
  onSelect={() => {}}
  isSelected={true}
/>
```

### MapView Component Props

```jsx
<MapView
  provider={PROVIDER_GOOGLE}
  style={StyleSheet.absoluteFillObject}
  mapType="standard"
  initialRegion={{
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
  onLongPress={(e) => {
    getLongPressPlace(
      e.nativeEvent.coordinate.latitude,
      e.nativeEvent.coordinate.longitude
    );
  }}
/>
```

## Environment Configuration Sample

### .env File

```bash
# Google Maps API Key
GOOGLE_MAPS_API_KEY=AIzaSyDRgXtqI3r5pKMcQx--3GzVMtgFvxIK_po

# Appwrite Endpoint
APPWRITE_ENDPOINT=https://travx-appwrite.example.com/v1

# Appwrite Project ID
APPWRITE_PROJECT_ID=travelmate-project
```

## Package.json Dependencies

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.2.0",
    "expo": "~54.0.24",
    "expo-file-system": "^19.0.19",
    "expo-font": "~14.0.9",
    "expo-location": "~19.0.7",
    "expo-navigation-bar": "~5.0.9",
    "expo-router": "~6.0.15",
    "expo-sqlite": "~15.1.2",
    "expo-status-bar": "~3.0.8",
    "install": "^0.13.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-animatable": "^1.4.0",
    "react-native-appwrite": "0.18.0",
    "react-native-maps": "1.20.1",
    "react-native-safe-area-context": "^5.4.0",
    "react-native-screens": "~4.16.0",
    "react-native-toast-message": "^2.2.1",
    "react-native-url-polyfill": "^2.0.0",
    "react-native-webview": "13.15.0"
  }
}
```

This sample data provides a comprehensive overview of the data structures used throughout the TravX application, including database schemas, API responses, application state, component props, and configuration files.