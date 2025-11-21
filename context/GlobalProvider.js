import React, { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser } from "../lib/appwrite";
import { InsertEverything } from "../lib/dbInsert";
import { ThemeProvider } from "./ThemeProvider";
import { getSavedPlaces } from "../lib/savePlaces";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPlaces, setRecentPlaces] = useState([]);
  const [historyPlaces, setHistoryPlaces] = useState([]);

  // Fetch saved places when the app starts
  useEffect(() => {
    const fetchSavedPlaces = async () => {
      try {
        const history = await getSavedPlaces('history');
        const recent = await getSavedPlaces('recent');
        
        // Format the data for use in components (ensure consistent property names)
        const formattedHistory = history.map(place => ({
          name: place.name,
          street: place.street || '',
          Lat: place.lat,
          Long: place.long
        }));
        
        const formattedRecent = recent.map(place => ({
          name: place.name,
          street: place.street || '',
          Lat: place.lat,
          Long: place.long
        }));
        
        setHistoryPlaces(formattedHistory);
        setRecentPlaces(formattedRecent);
      } catch (error) {
        console.error('Error fetching saved places:', error);
      }
    };
    
    fetchSavedPlaces();
  }, []);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res) {
          setIsLogged(true);
          setUser(res);
        } else {
          setIsLogged(false);
          setUser(null);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    InsertEverything();
  }, []);

  return (
    <ThemeProvider>
      <GlobalContext.Provider
        value={{
          isLogged,
          setIsLogged,
          user,
          setUser,
          loading,
          setLoading,
          recentPlaces,
          setRecentPlaces,
          historyPlaces,
          setHistoryPlaces
        }}
      >
        {children}
      </GlobalContext.Provider>
    </ThemeProvider>
  );
};

export default GlobalProvider;
