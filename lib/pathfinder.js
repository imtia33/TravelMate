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

export const findshortestPath = async (start, end) => {
  const db = await SQLite.openDatabaseAsync('routes.db');
  const routeCache = new Map();
  const bestRoutes = [];
  const visitedStates = new Map();
  const MAX_DISTANCE_DIFFERENCE = 2; // Maximum allowed distance difference (in km)

  // Manually implementing a priority queue
  const priorityQueue = [];

  // Helper function to manage the priority queue
  const enqueue = (node, totalDistance, path) => {
    priorityQueue.push({ node, totalDistance, path });
    priorityQueue.sort((a, b) => a.totalDistance - b.totalDistance); // Sort by shortest distance
  };

  const dequeue = () => priorityQueue.shift(); // Pop the shortest path

  const getRoutesFrom = async (from) => {
    if (routeCache.has(from)) return routeCache.get(from);
    const routes = await db.getAllAsync('SELECT * FROM routes WHERE "From" = ?', from);
    routeCache.set(from, routes);
    return routes;
  };

  const updateBestRoutes = (newRoute) => {
    // If fewer than 3 routes, add if within distance limit
    if (bestRoutes.length < 3) {
      if (
        bestRoutes.length === 0 ||
        newRoute.totalDistance <= bestRoutes[0].totalDistance + MAX_DISTANCE_DIFFERENCE
      ) {
        bestRoutes.push(newRoute);
        bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
      }
    } else if (
      newRoute.totalDistance < bestRoutes[bestRoutes.length - 1].totalDistance &&
      newRoute.totalDistance <= bestRoutes[0].totalDistance + MAX_DISTANCE_DIFFERENCE
    ) {
      bestRoutes.pop();
      bestRoutes.push(newRoute);
      bestRoutes.sort((a, b) => a.totalDistance - b.totalDistance);
    }
  };

  const dfs = async () => {
    enqueue(start, 0, []); // Start with the initial node

    while (priorityQueue.length > 0) {
      const { node, totalDistance, path } = dequeue();

      // Avoid revisiting nodes if the total distance is not optimal
      if (visitedStates.has(node) && visitedStates.get(node) <= totalDistance) {
        continue;
      }

      visitedStates.set(node, totalDistance);

      // If we reached the end node, update the best routes
      if (node === end) {
        const newRoute = { path: [...path, end], totalDistance };
        updateBestRoutes(newRoute);
        if (bestRoutes.length === 3) return; // Stop early if we have 3 routes
      }

      const connections = await getRoutesFrom(node);

      // Explore all the connections from the current node
      for (const connection of connections) {
        const nextNode = connection.To;
        const distance = parseFloat(connection.distanceKm);

        if (!visitedStates.has(nextNode) || visitedStates.get(nextNode) > totalDistance + distance) {
          enqueue(nextNode, totalDistance + distance, [...path, node]);
        }
      }
    }
  };

  await dfs();
  console.log(bestRoutes)
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
    const visited = new Set();
    let safetyCounter = 0;
    while (currentDoc && currentDoc.From !== From && safetyCounter < 100) {
      if (visited.has(currentDoc.From)) break;
      visited.add(currentDoc.From);
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
      safetyCounter++;
    }
    return temp2;
  };

  const Backadder = (doc) => {
    let currentDoc = doc;
    const temp2 = [];
    const visited = new Set();
    let safetyCounter = 0;
    while (currentDoc && currentDoc.To !== To && safetyCounter < 100) {
      if (visited.has(currentDoc.To)) break;
      visited.add(currentDoc.To);
      let temp = merged
        .filter((item) => item.From === currentDoc.To)
        .sort((a, b) => b.distance - a.distance);
      if (temp.length === 0) {
        temp = separate
          .filter((item) => item.From === currentDoc.To)
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
      safetyCounter++;
    }
    return temp2;
  };

  const chainer = (arr) => {
    const temp2 = [];
    const starter = arr.filter((item) => item.From === From);
    if (starter.length === 0) return temp2;
    temp2.push(...starter);
    let currentDoc = starter[0];
    const visited = new Set();
    let safetyCounter = 0;
    while (currentDoc && currentDoc.To !== To && safetyCounter < 200) {
      if (visited.has(currentDoc.To)) break;
      visited.add(currentDoc.To);
      const temp = arr.filter((item) => item.From === currentDoc.To);
      if (temp.length === 0) break;
      temp2.push(...temp);
      currentDoc = temp[0];
      safetyCounter++;
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
      const starter = temp.find((item) => item.From === From);
      const ender = temp.find((item) => item.To === To);
      if (starter && ender) {
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
export const fetchLocationsInChunks = async (offset = 0, limit = 100, firstChar) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  const results = await db.getAllAsync(
    "SELECT Name FROM locations WHERE LOWER(Name) LIKE ? LIMIT ? OFFSET ?",
    [`${firstChar.toLowerCase()}%`, limit, offset]
  );
  return results;
};

// Levenshtein Distance Algorithm for typo detection
const levenshteinDistance = (a, b) => {
  if (!a || !b) return Infinity;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => 
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
};
const jaroWinklerSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0, transpositions = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0.0;

  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const m = matches;
  const jaro = (m / s1.length + m / s2.length + (m - transpositions / 2) / m) / 3;
  const prefixLength = [...s1].findIndex((c, i) => c !== s2[i]) || 0;
  return jaro + Math.min(0.1, 1 / s1.length) * prefixLength * (1 - jaro);
};

// Find best match with typo detection
export const findBestMatch = async (search) => {
  if (!search || search.length < 2) return null; // Prevents invalid input

  console.log("Searching for:", search);
  let offset = 0;
  let bestMatch = null;
  let highestSimilarity = 0;
  let minDistance = Infinity;
  const normalizedSearch = search.trim().toLowerCase();
  const firstChar = normalizedSearch[0];

  while (offset < 1000) {
    const locations = await fetchLocationsInChunks(offset, 100, firstChar);
    if (!locations.length) break;

    for (const { Name } of locations) {
      const normalizedLocation = Name.toLowerCase();

      if (normalizedLocation === normalizedSearch) {
        return Name; // Exact match found, return immediately
      }

      // Compute both similarity scores
      const levenshteinScore = levenshteinDistance(normalizedSearch, normalizedLocation);
      const jaroScore = jaroWinklerSimilarity(normalizedSearch, normalizedLocation);

      if (levenshteinScore < minDistance || jaroScore > highestSimilarity) {
        minDistance = levenshteinScore;
        highestSimilarity = jaroScore;
        bestMatch = Name;
      }
    }

    offset += 100;
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


