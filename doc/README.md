# TravX Documentation

This directory contains comprehensive documentation for the TravX smart route planning application.

## Documentation Files

1. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - High-level overview of the project, features, and architecture
2. [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md) - Detailed technical architecture and system components
3. [CORE_ALGORITHMS.md](CORE_ALGORITHMS.md) - Explanation of the core routing algorithms and their implementation
4. [SAMPLE_DATA.md](SAMPLE_DATA.md) - Sample data structures, database schemas, and API responses
5. [SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md) - Instructions for setting up, building, and deploying the application

## Project Overview

TravX is a smart route planning mobile application built with React Native and Expo. The application helps users find optimal routes from their current location to a destination using a combination of Google Maps and Photon geocoding services.

Key features include:
- Route optimization based on distance, time, and traffic conditions
- Interactive maps with zoom, pan, and multi-touch gestures
- Multiple route options tailored to user preferences
- Offline mode for saving favorite routes
- Smart search with real-time suggestions
- Customizable map layers (standard and hybrid views)
- Real-time tracking with smooth animations
- Route preview in Google Maps WebView

## Technology Stack

- **Frontend**: React Native with Expo
- **Maps**: react-native-maps with Google Maps integration
- **Geolocation**: expo-location for device location services
- **Backend**: Appwrite for user authentication and data storage
- **Routing Engine**: Custom algorithm using SQLite database with precomputed routes
- **UI Components**: Custom-built components for consistent user experience

## Directory Structure

```
doc/
├── PROJECT_OVERVIEW.md
├── TECHNICAL_ARCHITECTURE.md
├── CORE_ALGORITHMS.md
├── SAMPLE_DATA.md
└── SETUP_AND_DEPLOYMENT.md
```

Each documentation file serves a specific purpose in understanding and maintaining the TravX application:

- **PROJECT_OVERVIEW.md**: Provides a high-level understanding of the application's purpose, features, and architecture
- **TECHNICAL_ARCHITECTURE.md**: Details the system components, data flow, and technical implementation
- **CORE_ALGORITHMS.md**: Explains the custom routing algorithms that power the application's core functionality
- **SAMPLE_DATA.md**: Shows examples of data structures, database schemas, and API responses
- **SETUP_AND_DEPLOYMENT.md**: Provides instructions for setting up the development environment and deploying the application

## Getting Started

To get started with the TravX documentation, begin with [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for a general understanding of the application, then proceed to the more technical documents as needed.