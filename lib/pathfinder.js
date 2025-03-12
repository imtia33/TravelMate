import * as SQLite from "expo-sqlite";

export const findTop3DistinctRoutes = async (start, end) => {
  const db=await SQLite.openDatabaseAsync("routes.db");
  const routeCache = new Map();
  const bestRoutes = [];
  const visitedStates = new Map();

  const dfs = async (currentNode, path, totalDistance, visited) => {
      const stateKey = `${currentNode}-${Array.from(visited).join(",")}`;
      if (visitedStates.has(stateKey) && visitedStates.get(stateKey) <= totalDistance) return;
      visitedStates.set(stateKey, totalDistance);

      if (currentNode === end) {
          const newRoute = { path: [...path, end], totalDistance };
          updateBestRoutes(newRoute);
          return;
      }

      visited.add(currentNode);

      const connections = await getRoutesFrom(currentNode);
      const promises = connections.map(async (connection) => {
          const nextNode = connection.To;
          const distance = parseFloat(connection.distanceKm);
          if (!visited.has(nextNode)) {
              await dfs(
                  nextNode,
                  [...path, currentNode],
                  totalDistance + distance,
                  visited
              );
          }
      });
      await Promise.all(promises);

      visited.delete(currentNode); // Backtrack
  };

  const getRoutesFrom = async (from) => {
      if (routeCache.has(from)) return routeCache.get(from);

      const routes = await db.getAllAsync(
          'SELECT * FROM routes WHERE "From" = ?',
          from
      );
      routeCache.set(from, routes);
      return routes;
  };

  const updateBestRoutes = (newRoute) => {
      if (bestRoutes.length < 3) {
          bestRoutes.push(newRoute);
          bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
      } else if (newRoute.totalDistance < bestRoutes[bestRoutes.length - 1].totalDistance ) {
          bestRoutes.pop();
          bestRoutes.push(newRoute);
          bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
      }
  };

  await dfs(start, [], 0, new Set());
  const sortedBestRoutes = bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
  return sortedBestRoutes.slice(0, 3);
  
};
export const fetchAndSeparatePaths = async (path) => {
    const db=await SQLite.openDatabaseAsync("routes.db");
  if (!Array.isArray(path) || path.length === 0) {
    console.error("Invalid path provided to fetchAndSeparatePaths");
    return [];
  }

  const queries = path.map((from, i) =>
      i < path.length - 1
          ? db.getFirstAsync(
              'SELECT * FROM routes WHERE "From" = ? AND "To" = ?;',
              path[i],
              path[i + 1]
            )
          : null
  );
  const results = await Promise.all(queries);

  const separated = [];
  for (const currentData of results) {
      if (!currentData) continue;

      const vehicles = currentData.Vehicles.replace(/[\[\]]/g, "").split(",").map(vehicle => vehicle.trim());
      for (const vehicle of vehicles) {
        separated.push({
          From: currentData.From,
          To: currentData.To,
          Vehicle: vehicle,
          distance: currentData.distanceKm,
          used: false,
        });
      }
  }

  return separated;
};
export const merge = async (docs) => {
    const db=await SQLite.openDatabaseAsync("routes.db");
  if (!Array.isArray(docs) || docs.length === 0) {
    console.error("Invalid documents provided to merge");
    return [];
  }

  const mergedResults = [];
  const usedIndices = new Set();

  for (let i = 0; i < docs.length; i++) {
      if (usedIndices.has(i)) continue; // Skip if already used

      let currentDoc = { ...docs[i] };

      for (let j = 0; j < docs.length; j++) {
          if (i !== j && !usedIndices.has(j)) {
              // Check if the two documents can be merged
              if (currentDoc.To === docs[j].From && currentDoc.Vehicle === docs[j].Vehicle) {
                  currentDoc.To = docs[j].To;
                  currentDoc.distance += docs[j].distance;
                  usedIndices.add(j);
              }
          }
      }
      currentDoc.fare = await fare(currentDoc.distance, currentDoc.Vehicle);
      mergedResults.push(currentDoc);
  }
  return mergedResults;
};
export const combination = async(separate, merged, From, To) => {
    const db=await SQLite.openDatabaseAsync("routes.db");
  if (!Array.isArray(merged) || merged.length === 0) {
    console.error("Invalid merged documents provided to combination");
    return [];
  }

  const comb = [];
  
  for (const doc of merged) {
      if (doc.used || doc.Vehicle === "Walk") continue;

      let temp = [];
      if (doc.From === From && doc.To === To) {
          temp.push(doc);
          const matchingMerged = merged.filter(d => d.From === From && d.To === To && d.Vehicle !== doc.Vehicle);
          
          temp.push(...matchingMerged);
          comb.push(temp);

          matchingMerged.forEach(d => d.used = true);
          doc.used = true;
          continue;
      }
      
      temp.push(doc);
      let lastSegment = temp[temp.length - 1];
      let lastTo = lastSegment.To;
      
      const visited = new Set(); 
      
      const addMatchingSegments = (currentTo) => {
          if (visited.has(currentTo)) return;
          visited.add(currentTo);

          let matchingMerged = merged.filter(doc => doc.From === currentTo && !doc.used);
          if (matchingMerged.length > 0) {
              temp.push(...matchingMerged);
              lastTo = matchingMerged[0].To;

              let matchingSeparate = separate.filter(doc => 
                doc.From === matchingMerged[0].From && 
                doc.To === matchingMerged[0].To && 
                doc.Vehicle !== matchingMerged[0].Vehicle
              );

              if (matchingSeparate.length > 0) {
                  temp.push(...matchingSeparate);
                  lastTo = matchingSeparate[0].To;
              }
              addMatchingSegments(lastTo);
          } else {
              let matchingSeparate = separate.filter(doc => doc.From === currentTo && !doc.used);
              if (matchingSeparate.length > 0) {
                  temp.push(...matchingSeparate);
                  lastTo = matchingSeparate[0].To;
                  addMatchingSegments(lastTo);
              }
          }
      };

      addMatchingSegments(lastTo);

      const addBackwardSegments = (currentFrom) => {
          if (visited.has(currentFrom)) return;
          visited.add(currentFrom);

          let matchingMerged = merged.filter(doc => doc.To === currentFrom && !doc.used);
          if (matchingMerged.length > 0) {
              temp = [...matchingMerged, ...temp];
              currentFrom = temp[0].From;

              let matchingSeparate = separate.filter(doc => 
                doc.To === matchingMerged[0].To && 
                doc.From === matchingMerged[0].From && 
                doc.Vehicle !== matchingMerged[0].Vehicle
              );

              if (matchingSeparate.length > 0) {
                  temp = [...matchingSeparate, ...temp];
                  currentFrom = temp[0].From;
              }
              addBackwardSegments(currentFrom);
          } else {
              let matchingSeparate = separate.filter(doc => doc.To === currentFrom && !doc.used);
              if (matchingSeparate.length > 0) {
                  temp = [...matchingSeparate, ...temp];
                  currentFrom = temp[0].From;
                  addBackwardSegments(currentFrom);
              }
          }
      };

      addBackwardSegments(lastSegment.From);

      const uniqueTemp = temp.filter((item, index, self) =>
        index === self.findIndex((t) => (
          t.From === item.From && t.To === item.To && t.Vehicle === item.Vehicle && t.distance === item.distance && t.fare === item.fare
        ))
      );

      if (uniqueTemp.length > 0 && uniqueTemp[uniqueTemp.length - 1].To === To && uniqueTemp[0].From === From) {
          comb.push(uniqueTemp);
      }
  }

    let sortedComb = comb.sort((a, b) => {
    const uniqueFromA = new Set(a.map(doc => doc.From)).size;
    const uniqueToA = new Set(a.map(doc => doc.To)).size;
    const uniqueFromB = new Set(b.map(doc => doc.From)).size;
    const uniqueToB = new Set(b.map(doc => doc.To)).size;

    return (uniqueFromA + uniqueToA) - (uniqueFromB + uniqueToB);
  });
  if(sortedComb.length > 2){
  sortedComb = sortedComb.slice(0, 2);
  }

  if (sortedComb[0] && sortedComb[1] && sortedComb[0].length === sortedComb[1].length) {
      const similarDocs = [];

      for (const doc of sortedComb) {
          const uniqueFrom = new Set(doc.map(d => d.From));
          const uniqueTo = new Set(doc.map(d => d.To));

          for (const otherDoc of sortedComb) {
              if (doc === otherDoc) continue;

              const otherUniqueFrom = new Set(otherDoc.map(d => d.From));
              const otherUniqueTo = new Set(otherDoc.map(d => d.To));

              const commonFrom = new Set([...uniqueFrom].filter(x => otherUniqueFrom.has(x)));
              const commonTo = new Set([...uniqueTo].filter(x => otherUniqueTo.has(x)));

              if (commonFrom.size > 0 || commonTo.size > 0) {
                  similarDocs.push(...otherDoc);
              }
          }
      }

      if (similarDocs.length > 0) {
          sortedComb[0].push(...similarDocs);
          return [sortedComb[0]];
      }
  }

  return sortedComb;
};
export const fare = async (distance, vehicle) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  try {
    const fareData = await db.getAllAsync('SELECT * FROM Fare Where Vehicle = ?', [vehicle]);
    if(fareData[0].fareFixed){ return fareData[0].fareFixed;}

    const VF = Math.ceil(fareData[0].farePKM*distance);
    const VF2 = fareData[0].fareMin;
    return VF<VF2?VF2:VF;

  } catch (error) {
    return 0;
  }
};
export const polylinemaker = async (path) => {
    const db=await SQLite.openDatabaseAsync("routes.db");
  const queries = [];
  for (let i = 0; i < path.length - 1; i++) {
    let res = await db.getFirstAsync('SELECT * FROM locations WHERE "Name" = ?', `${path[i]}-${path[i + 1]}`);
         if(i<path.length - 1){
          
          if (res && res.Coordinates2) {
            const coordinatesArray = JSON.parse(res.Coordinates2);
            queries.push(...coordinatesArray);
          }
         }
         else{
          if (res && res.Coordinates) {
           const coordinatesArray = JSON.parse(res.Coordinates);
           queries.push(...coordinatesArray);
          }
         }
         
  }
  //console.log(queries)
  return queries;
};
export const fetchSuggestions = async (type, input) => {
  const db=await SQLite.openDatabaseAsync("routes.db");
  return await db.getAllAsync(
    `SELECT * FROM locations WHERE "Name" LIKE ? AND single = true;`,
    [`%${input}%`]
  );
};

export const fetchLocationDetails = async (name) => {
    const db=await SQLite.openDatabaseAsync("routes.db");
    return await db.getAllAsync(
      'SELECT * FROM locations WHERE Name = ? AND single = true',
      [name]
    );
};

export const fetchLocationsInChunks = async (offset = 0, limit = 20) => {
    const db = await SQLite.openDatabaseAsync("routes.db");
    const results = await db.getAllAsync(
      'SELECT Name FROM places LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return results;
};
const levenshteinDistance = (a, b) => {
    const dp = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[a.length][b.length];
};
export const findBestMatch = async (search) => {
    let offset = 0;
    let bestMatch = null;
    let minDistance = Infinity;
    const minMatchThreshold = search.length / 2; // At least 50% match


    while (true) {
      const locations = await fetchLocationsInChunks(offset, 100);

      if (locations.length === 0) break;

      locations.forEach((location) => {
        const distance = levenshteinDistance(search.toLowerCase(), location.Name.toLowerCase());
        if (distance < minDistance && distance <= minMatchThreshold) {
          minDistance = distance;
          bestMatch = location.Name;
        }
      });

      offset += 20;
    }

    return bestMatch;
};
export const fetchLocations = async () => {
    const db=await SQLite.openDatabaseAsync("routes.db");
    return await db.getAllAsync('SELECT * FROM locations WHERE single = true');
};
export const findClosestLocation = async (lat, long) => {
    try {
      const position = {
        latitude: lat,
        longitude: long
      };
      const locations = await fetchLocations();
      let closestLocation = null;
      let minDistance = Infinity;
  
      const toRadians = (degrees) => degrees * (Math.PI / 180);
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Radius of the Earth in meters
        const φ1 = toRadians(lat1);
        const φ2 = toRadians(lat2);
        const Δφ = toRadians(lat2 - lat1);
        const Δλ = toRadians(lon2 - lon1);
  
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
        return R * c; // Distance in meters
      };
  
      for (const loc of locations) {
        const locCoords = JSON.parse(loc.Coordinates)[0];
        const distance = calculateDistance(
          position.latitude,
          position.longitude,
          locCoords[0],
          locCoords[1]
        );
  
        if (distance < minDistance && distance <= 2000) { // Filter for locations within 2000 meters
          minDistance = distance;
          closestLocation = loc;
        }
      }
     if(closestLocation){
      return closestLocation.Name;
     }
     return null
    } catch (error) {
      console.error('Error finding closest location:', error);
      return null;
    }
};

export const fetchPhotonResults = async (query, setResults, setLoading, cache, setCache, bbox ) => {
  if (!query) {
      setResults([]);
      return;
  }

  // Check if query is cached
  const cachedResults = cache.get(query);
  if (cachedResults) {
      setResults(cachedResults); // Use cached results
      return;
  }

  setLoading(true); // Start loading spinner
  try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=${bbox}&lang=en`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
          const processedResults = data.features.map(feature => ({
              Name: feature.properties.name,
              District: feature.properties.city || feature.properties.state ,
              Latitude: feature.geometry.coordinates[1],
              Longitude: feature.geometry.coordinates[0],
          }));

          // Cache the results for future use
          setCache(new Map(cache.set(query, processedResults)));

          // Set the results state
          setResults(processedResults);
        
      }
  } catch (error) {
      console.error('Error fetching data:', error);
  } finally {
      setLoading(false); // Stop loading spinner
  }
};

