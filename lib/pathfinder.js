import * as SQLite from "expo-sqlite";

export const findTop3DistinctRoutes = async (start, end) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  const routeCache = new Map();
  const bestRoutes = [];
  const visitedStates = new Map();
  const MAX_DISTANCE_DIFFERENCE = 2; // 2 km maximum difference allowed

  const dfs = async (currentNode, path, totalDistance, visited) => {
    const stateKey = `${currentNode}-${Array.from(visited).join(",")}`;
    if (
      visitedStates.has(stateKey) &&
      visitedStates.get(stateKey) <= totalDistance
    )
      return;
    visitedStates.set(stateKey, totalDistance);

    // If shortest route exists and current distance exceeds shortest + MAX_DISTANCE_DIFFERENCE, stop exploring
    if (
      bestRoutes.length > 0 &&
      totalDistance > bestRoutes[0].totalDistance + MAX_DISTANCE_DIFFERENCE
    ) {
      return;
    }

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
    // If less than 3 routes, add if within distance limit
    if (bestRoutes.length < 3) {
      if (
        bestRoutes.length === 0 ||
        newRoute.totalDistance <=
          bestRoutes[0].totalDistance + MAX_DISTANCE_DIFFERENCE
      ) {
        bestRoutes.push(newRoute);
        bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
      }
    } else if (
      newRoute.totalDistance <
        bestRoutes[bestRoutes.length - 1].totalDistance &&
      newRoute.totalDistance <=
        bestRoutes[0].totalDistance + MAX_DISTANCE_DIFFERENCE
    ) {
      bestRoutes.pop();
      bestRoutes.push(newRoute);
      bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
    }
  };

  await dfs(start, [], 0, new Set());
  return bestRoutes;
};
export const fetchAndSeparatePaths = async (path) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
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

    const vehicles = currentData.Vehicles.replace(/[\[\]]/g, "")
      .split(",")
      .map((vehicle) => vehicle.trim());
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
  if (!Array.isArray(docs) || docs.length === 0) {
    console.error("Invalid documents provided to merge");
    return [];
  }

  const mergedResults = [];
  const usedIndices = new Set();

  for (let i = 0; i < docs.length; i++) {
    if (usedIndices.has(i)) continue;

    let currentDoc = { ...docs[i] };

    for (let j = 0; j < docs.length; j++) {
      if (i !== j && !usedIndices.has(j)) {
        if (
          currentDoc.To === docs[j].From &&
          currentDoc.Vehicle === docs[j].Vehicle &&
          currentDoc.Vehicle !== "Walk" && 
          docs[j].Vehicle !== "Walk"
        ) {
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
export const combination = async (separate, merged, From, To) => {
  merged.sort((a, b) => b.distance - a.distance);
  const comb = [];

  const Frontadder = (doc) => {
    let currentDoc = doc;
    const temp2 = [];
    while (currentDoc && currentDoc.From !== From) {
      let temp = merged
        .filter((item) => item.To === currentDoc.From)
        .sort((a, b) => b.distance - a.distance);

      if (temp.length === 0) {
        temp = separate
          .filter((item) => item.To === currentDoc.From)
          .sort((a, b) => b.distance - a.distance);
      }
      if (temp.length === 0) break;
      temp2.push(temp[0]);
      const checkAgain = merged.filter(
        (item) =>
          item.From === temp[0].From &&
          item.To === temp[0].To &&
          item.Vehicle !== temp[0].Vehicle
      );
      temp2.push(...checkAgain);
      currentDoc = temp[0];
    }
    return temp2;
  };
  const Backadder = (doc) => {
    let currentDoc = doc;
    const temp2 = [];
    while (currentDoc && currentDoc.To !== To) {
      let temp = merged
        .filter((item) => item.From === currentDoc.To)
        .sort((a, b) => b.distance - a.distance);
      if (temp.length === 0) {
        temp = separate
          .filter((item) => item.To === currentDoc.From)
          .sort((a, b) => b.distance - a.distance);
      }
      if (temp.length === 0) break;
      temp2.push(temp[0]);
      const checkAgain = merged.filter(
        (item) =>
          item.From === temp[0].From &&
          item.To === temp[0].To &&
          item.Vehicle !== temp[0].Vehicle
      );
      temp2.push(...checkAgain);
      currentDoc = temp[0];
    }
    return temp2;
  };
  const chainer = (arr) => {
    const temp2 = [];
    const starter = arr.filter((item) => item.From === From);
    temp2.push(...starter);
    let currentDoc = starter[0];
    while (currentDoc && currentDoc.To !== To) {
      const temp = arr.filter((item) => item.From === currentDoc.To);
      temp2.push(...temp);
      currentDoc = temp[0];
    }
    return temp2;
  };
 
  let j = 0;
  for (let i = 0; i < merged.length; i++) {
    if (j === 2) break;
    const temp = [];
    const similer = merged.filter(
      (item) =>
        item.From === merged[i].From &&
        item.To === merged[i].To &&
        item.Vehicle !== merged[i].Vehicle
    );
    temp.push(merged[i]);
    temp.push(...similer);
    i += similer.length;
    const r1 = Frontadder(merged[i]);
    temp.unshift(...r1);
    const r2 = Backadder(merged[i]);
    temp.push(...r2);

    const exists = comb.some((existingComb) =>
      temp.every((item) =>
        existingComb.some(
          (existingItem) =>
            existingItem.From === item.From &&
            existingItem.To === item.To &&
            existingItem.Vehicle === item.Vehicle
        )
      )
    );
    if (!exists) {
      const starter= temp.find((item) => item.From === From);
      const ender= temp.find((item) => item.To === To);
      if(starter && ender){
      const temp2 = chainer(temp);
      comb.push(temp2);
      j++;
      }
    }
  }

  return comb;
};

export const fare = async (distance, vehicle) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  try {
    const fareData = await db.getAllAsync(
      "SELECT * FROM Fare Where Vehicle = ?",
      [vehicle]
    );
    if (fareData[0].fareFixed) {
      return fareData[0].fareFixed;
    }

    const VF = Math.ceil(fareData[0].farePKM * distance);
    const VF2 = fareData[0].fareMin;
    return VF < VF2 ? VF2 : VF;
  } catch (error) {
    return 0;
  }
};
export const polylinemaker = async (path) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  const queries = [];
  for (let i = 0; i < path.length - 1; i++) {
    let res = await db.getFirstAsync(
      'SELECT * FROM locations WHERE "Name" = ?',
      `${path[i]}-${path[i + 1]}`
    );
    if (i < path.length - 1) {
      if (res && res.Coordinates2) {
        const coordinatesArray = JSON.parse(res.Coordinates2);
        queries.push(...coordinatesArray);
      }
    } else {
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
  const db = await SQLite.openDatabaseAsync("routes.db");
  return await db.getAllAsync(
    `SELECT * FROM locations WHERE "Name" LIKE ? AND single = true;`,
    [`%${input}%`]
  );
};

export const fetchLocationDetails = async (name) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  return await db.getAllAsync(
    "SELECT * FROM locations WHERE Name = ? AND single = true",
    [name]
  );
};

export const fetchLocationsInChunks = async (offset = 0, limit = 20) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  const results = await db.getAllAsync(
    "SELECT Name FROM places LIMIT ? OFFSET ?",
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
      const distance = levenshteinDistance(
        search.toLowerCase(),
        location.Name.toLowerCase()
      );
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
  const db = await SQLite.openDatabaseAsync("routes.db");
  return await db.getAllAsync("SELECT * FROM locations WHERE single = true");
};
export const findClosestLocation = async (lat, long) => {
  try {
    const position = {
      latitude: lat,
      longitude: long,
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

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

      if (distance < minDistance && distance <= 2000) {
        // Filter for locations within 2000 meters
        minDistance = distance;
        closestLocation = loc;
      }
    }
    if (closestLocation) {
      return closestLocation.Name;
    }
    return null;
  } catch (error) {
    console.error("Error finding closest location:", error);
    return null;
  }
};

export const fetchPhotonResults = async (
  query,
  setResults,
  setLoading,
  cache,
  setCache,
  bbox
) => {
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
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&limit=5&bbox=${bbox}&lang=en`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features) {
      const processedResults = data.features.map((feature) => ({
        Name: feature.properties.name,
        District: feature.properties.city || feature.properties.state,
        Latitude: feature.geometry.coordinates[1],
        Longitude: feature.geometry.coordinates[0],
      }));

      // Cache the results for future use
      setCache(new Map(cache.set(query, processedResults)));

      // Set the results state
      setResults(processedResults);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false); // Stop loading spinner
  }
};
