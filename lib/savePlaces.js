import * as SQLite from "expo-sqlite";
import { useGlobalContext } from "../context/GlobalProvider";

// Function to save a place with category (recent or history)
export const savePlace = async (place, category, updateRecentPlaces = null, updateHistoryPlaces = null) => {
  const db = await SQLite.openDatabaseAsync("routes.db", {
    useNewConnection: true
  });
  
  try {
    // Normalize property names to handle both cases (uppercase and lowercase)
    const normalizedPlace = {
      name: place.name || place.Name || '',
      street: place.street || place.Street || '',
      latitude: place.latitude || place.Latitude || place.lat || 0,
      longitude: place.longitude || place.Longitude || place.long || 0
    };
    
    // Check if a place with the same name already exists in the same category
    const existingPlace = await db.getAllAsync(
      'SELECT * FROM saved_places WHERE name = ? AND category = ?;',
      [normalizedPlace.name, category]
    );
    
    // If a place with the same name exists in the same category, don't save it
    if (existingPlace.length > 0) {
      console.log(`Place with name '${normalizedPlace.name}' already exists in category '${category}', skipping save.`);
      return null;
    }
    
    // Insert the new place
    const result = await db.runAsync(
      'INSERT INTO saved_places (name, street, lat, long, category) VALUES (?, ?, ?, ?, ?);',
      [
        normalizedPlace.name,
        normalizedPlace.street,
        normalizedPlace.latitude,
        normalizedPlace.longitude,
        category
      ]
    );
    
    // Get the ID of the inserted place
    const insertId = result.lastInsertRowId;
    
    // Enforce limits: 2 for recent, 5 for history
    let deletedIds = [];
    if (category === 'recent') {
      // Delete oldest entries if we have more than 2
      const deleteResult = await db.getAllAsync(
        `SELECT id FROM saved_places 
         WHERE category = 'recent' 
         ORDER BY id ASC 
         LIMIT MAX(0, (SELECT COUNT(*) FROM saved_places WHERE category = 'recent') - 2)`
      );
      
      deletedIds = deleteResult.map(row => row.id);
      
      if (deletedIds.length > 0) {
        await db.runAsync(
          `DELETE FROM saved_places WHERE id IN (${deletedIds.join(',')})`
        );
      }
    } else if (category === 'history') {
      // Delete oldest entries if we have more than 5
      const deleteResult = await db.getAllAsync(
        `SELECT id FROM saved_places 
         WHERE category = 'history' 
         ORDER BY id ASC 
         LIMIT MAX(0, (SELECT COUNT(*) FROM saved_places WHERE category = 'history') - 5)`
      );
      
      deletedIds = deleteResult.map(row => row.id);
      
      if (deletedIds.length > 0) {
        await db.runAsync(
          `DELETE FROM saved_places WHERE id IN (${deletedIds.join(',')})`
        );
      }
    }
    
    // If we have update functions, fetch the latest data and update the global context
    if ((category === 'recent' && updateRecentPlaces) || (category === 'history' && updateHistoryPlaces)) {
      const allPlaces = await db.getAllAsync(
        'SELECT * FROM saved_places WHERE category = ? ORDER BY id DESC',
        [category]
      );
      
      // Format the data
      const formattedPlaces = allPlaces.map(place => ({
        name: place.name,
        street: place.street || '',
        latitude: place.lat,
        longitude: place.long
      }));
      
      // Update the global context
      if (category === 'recent' && updateRecentPlaces) {
        updateRecentPlaces(formattedPlaces);
      } else if (category === 'history' && updateHistoryPlaces) {
        updateHistoryPlaces(formattedPlaces);
      }
    }
    
    return insertId;
  } catch (error) {
    console.error("Error saving place:", error);
    throw error;
  }
};

// Function to get saved places by category
export const getSavedPlaces = async (category) => {
  const db = await SQLite.openDatabaseAsync("routes.db", {
  useNewConnection: true
});
  
  try {
    const result = await db.getAllAsync(
      'SELECT * FROM saved_places WHERE category = ? ORDER BY id DESC',
      [category]
    );
    
    // Format the data to ensure consistent property names
    return result.map(place => ({
      id: place.id,
      name: place.name,
      street: place.street || '',
      lat: place.lat,
      long: place.long,
      category: place.category
    }));
  } catch (error) {
    console.error("Error getting saved places:", error);
    throw error;
  }
};

// Function to get all saved places
export const getAllSavedPlaces = async () => {
  const db = await SQLite.openDatabaseAsync("routes.db", {
  useNewConnection: true
});
  
  try {
    const result = await db.getAllAsync('SELECT * FROM saved_places ORDER BY category, id DESC');
    
    // Format the data to ensure consistent property names
    return result.map(place => ({
      id: place.id,
      name: place.name,
      street: place.street || '',
      lat: place.lat,
      long: place.long,
      category: place.category
    }));
  } catch (error) {
    console.error("Error getting all saved places:", error);
    throw error;
  }
};