import * as SQLite from "expo-sqlite";
import * as Location from "expo-location";

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

export const findshortestPath = async (start, end, district) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  const routeCache = new Map();
  const bestRoutes = [];
  const visitedStates = new Map();
  const MAX_DISTANCE_DIFFERENCE = 2;

  const priorityQueue = [];

  // Helper function to manage the priority queue
  const enqueue = (node, totalDistance, path) => {
    priorityQueue.push({ node, totalDistance, path });
    priorityQueue.sort((a, b) => a.totalDistance - b.totalDistance);
  };

  const dequeue = () => priorityQueue.shift();

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
    // If fewer than 3 routes, add if within distance limit
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

        if (
          !visitedStates.has(nextNode) ||
          visitedStates.get(nextNode) > totalDistance + distance
        ) {
          enqueue(nextNode, totalDistance + distance, [...path, node]);
        }
      }
    }
  };

  await dfs();
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
    if (res && res.Coordinates) {
        const coordinatesArray = JSON.parse(res.Coordinates);
        queries.push(...coordinatesArray);
    }
  }
  return queries;
};
export const fetchSuggestions = async (district, input) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  try {
    return await db.getAllAsync(
      `SELECT * FROM locations WHERE "Name" LIKE ? AND single = true AND District = ?;`,
      [`${input}%`, district]
    );
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
};

export const fetchLocationDetails = async (name, district) => {
  //currently has no use
  const db = await SQLite.openDatabaseAsync("routes.db");

  const res = await db.getAllAsync(
    "SELECT * FROM locations WHERE Name = ? AND single = true AND District = ?",
    [name, district]
  );
  return res[0];
};
export const fetchLocationsInChunks = async (
  offset = 0,
  limit = 100,
  firstChar,
  district
) => {
  console.log(district);
  const db = await SQLite.openDatabaseAsync("routes.db");
  const results = await db.getAllAsync(
    "SELECT Name FROM locations WHERE LOWER(Name) LIKE ? AND District = ? LIMIT ? OFFSET ?",
    [`${firstChar.toLowerCase()}%`, district, limit, offset]
  );
  return results;
};

const levenshteinDistance = (a, b) => {
  if (!a || !b) return Infinity;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );

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
const jaroWinklerSimilarity = (s1, s2) => {
  if (s1 === s2) return 1.0;
  if (!s1.length || !s2.length) return 0.0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0,
    transpositions = 0;
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
  const jaro =
    (m / s1.length + m / s2.length + (m - transpositions / 2) / m) / 3;
  const prefixLength = [...s1].findIndex((c, i) => c !== s2[i]) || 0;
  return jaro + Math.min(0.1, 1 / s1.length) * prefixLength * (1 - jaro);
};

export const findBestMatch = async (search, district) => {
  if (!search || search.length < 2) return null; // Prevents invalid input

  console.log("Searching for:", search);
  let offset = 0;
  let bestMatch = null;
  let highestSimilarity = 0;
  let minDistance = Infinity;
  const normalizedSearch = search.trim().toLowerCase();
  const firstChar = normalizedSearch[0];

  while (offset < 1000) {
    const locations = await fetchLocationsInChunks(
      offset,
      100,
      firstChar,
      district
    );
    console.log(locations);
    if (!locations.length) break;
    for (const doc of locations) {
      if (doc.Name === search.trim()) {
        return doc.Name;
      }
    }

    for (const { Name } of locations) {
      const normalizedLocation = Name.toLowerCase();

      if (normalizedLocation === normalizedSearch) {
        return Name; // Exact match found, return immediately
      }

      // Compute both similarity scores
      const levenshteinScore = levenshteinDistance(
        normalizedSearch,
        normalizedLocation
      );
      const jaroScore = jaroWinklerSimilarity(
        normalizedSearch,
        normalizedLocation
      );

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
export const fetchLocations = async (district) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  return await db.getAllAsync(
    "SELECT * FROM locations WHERE single = true AND District = ?",
    [district]
  );
};
export const findClosestLocation = async (lat, long, district) => {
  try {
    const position = {
      latitude: lat,
      longitude: long,
    };
    const locations = await fetchLocations(district);
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

  setLoading(true);
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      query
    )}&limit=10&bbox=${bbox}&lang=en`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features) {
      const processedResults = data.features.map((feature) => ({
        Name: feature.properties.name,
        District: feature.properties.city || feature.properties.state,
        Latitude: feature.geometry.coordinates[1],
        Longitude: feature.geometry.coordinates[0],
      }));

      setCache(new Map(cache.set(query, processedResults)));

      setResults(processedResults);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};
export const calcDistance = async (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};
export const generateArcPath = (start, end, steps = 50) => {
  if (
    !Array.isArray(start) ||
    !Array.isArray(end) ||
    start.length < 2 ||
    end.length < 2
  ) {
    console.warn("Invalid coordinates:", start, end);
    return [];
  }

  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  // Calculate distance (approximate)
  const distance = Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);

  // Dynamically adjust arc height & steps
  const arcHeight = Math.min(distance * 0.3, 0.002); // Max height of 0.002 degrees
  const dynamicSteps = Math.max(Math.floor(distance * 5000), 20); // More points for long distances

  let curvePoints = [];

  for (let i = 0; i <= dynamicSteps; i++) {
    const t = i / dynamicSteps;
    const lat = (1 - t) * lat1 + t * lat2;
    const lon = (1 - t) * lon1 + t * lon2;

    // Arc effect (adjusted for short distances)
    const arcOffset = Math.sin(t * Math.PI) * arcHeight;
    curvePoints.push([lat + arcOffset, lon]);
  }

  // Convert `[lat, lon]` to `{ latitude, longitude }`
  return curvePoints.map(([latitude, longitude]) => ({ latitude, longitude }));
};
export const AskForLocationPermission = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    return {
      error: 101,
      message: "Location Access Denied",
    };
  }
  const checkEnabled = await Location.hasServicesEnabledAsync();
  if (checkEnabled) {
    return {
      error: 103,
      message: "Success",
    };
  }

  try {
    await Location.enableNetworkProviderAsync();

    const providerStatus = await Location.getProviderStatusAsync();
    if (!providerStatus.locationServicesEnabled) {
      return {
        error: 102,
        message: "Location Services Are Off",
      };
    }

    return {
      error: 103,
      message: "Success",
    };
  } catch (e) {
    return {
      error: 102,
      message: "Location Services Are Off",
    };
  }
};

export function calculatePolylineLength(polyline) {
  const toRad = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Earth's radius in kilometers

  let totalDistance = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const [lon1, lat1] = polyline[i];
    const [lon2, lat2] = polyline[i + 1];

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    totalDistance += distance;
  }

  return totalDistance;
}
export function findClosestBinary(path, referencePoint, isStart = true) {
  const getDistance = (a, b) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  };

  let left = 0;
  let right = path.length - 1;
  let bestIndex = -1;
  let bestDistance = Infinity;

  while (right >= left) {
    const mid = Math.floor((left + right) / 2);
    const midPoint = path[mid];

    const distance = getDistance(referencePoint, midPoint);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = mid;
    }

    const midBack = mid > 0 ? path[mid - 1] : null;
    const midForward = mid < path.length - 1 ? path[mid + 1] : null;

    const backDist = midBack ? getDistance(referencePoint, midBack) : Infinity;
    const forwardDist = midForward
      ? getDistance(referencePoint, midForward)
      : Infinity;

    if (isStart) {
      if (backDist < forwardDist) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      if (forwardDist < backDist) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return { point: path[bestIndex], index: bestIndex, distance: bestDistance };
}
const getClosestPolyline = async (extra, check, marker) => {
  let closest = null;
  let closestName = "";
  let closestCoords = [];

  let main = null;
  let mainIndex = -1;
  let mainCoords = [];

  for (const doc of extra) {
    const res = findClosestBinary(
      doc.Coordinates,
      [marker.longitude, marker.latitude],
      check
    );

    if (doc.Name === "Main Path") {
      main = res;
      mainIndex = res.index;
      mainCoords = doc.Coordinates;
    } else if (!closest || res.distance < closest.distance) {
      closest = res;
      closestName = doc.Name;
      closestCoords = doc.Coordinates;
    }
  }

  // Safety: if closest is null (no extras), fall back to main
  if (!closest || !main) {
    const finalIndex = mainIndex;
    const finalLength = calculatePolylineLength(
      check
        ? mainCoords.slice(finalIndex + 1)
        : mainCoords.slice(0, finalIndex + 1)
    );
    return {
      name: "Main Path",
      length: finalLength,
      index: finalIndex,
    };
  }

  const threshold = 0.05;
  if (main.distance <= closest.distance + threshold) {
    const finalLength = calculatePolylineLength(
      check
        ? mainCoords.slice(mainIndex + 1)
        : mainCoords.slice(0, mainIndex + 1)
    );
    return {
      name: "Main Path",
      length: finalLength,
      index: mainIndex,
    };
  }

  const finalLength = calculatePolylineLength(
    check
      ? closestCoords.slice(closest.index + 1)
      : closestCoords.slice(0, closest.index + 1)
  );
  return {
    name: closestName,
    length: finalLength,
    index: closest.index,
  };
};

export const checkExpandNeeded = async (path, Point, Main, Begin,pointName) => {
  const db = await SQLite.openDatabaseAsync("routes.db");
  let Extra = [];
  if (Begin) {
    Extra = await db.getAllAsync(
      'SELECT Name,Coordinates FROM locations WHERE "Name" LIKE ? AND "Name" NOT LIKE ? AND single = ?',
      [`%${path[0]}`, `%${path[1]}-${path[0]}%`, false]
    );
  } else {
    Extra = await db.getAllAsync(
      'SELECT Name,Coordinates FROM locations WHERE "Name" LIKE ? AND "Name" NOT LIKE ? AND single = ?',
      [
        `${path[path.length - 1]}%`,
        `%${path[path.length - 2]}-${path[path.length - 1]}%`,
        false,
      ]
    );
  }
  let PharsedExtra = Extra.map((doc) => ({
    ...doc,
    Coordinates: JSON.parse(doc.Coordinates),
  }));
  PharsedExtra.push({
    Name: "Main Path",
    Coordinates: Main,
  });
  let closest = await getClosestPolyline(PharsedExtra, Begin, Point);
  
  if (closest.name === "Main Path") {
    return {
      index: closest.index,
      cut: true,
      Name: `Near ${pointName}`,
      cutLength: closest.length,
    };
  }
  let ExtraPolyline = [];
  if (closest.name !== "Main Path") {
    const foundExtra = PharsedExtra.find((doc) => doc.Name === closest.name);
    if (foundExtra) {
      ExtraPolyline = Begin
        ? foundExtra.Coordinates.slice(
            closest.index + 1,
            foundExtra.Coordinates.length
          )
        : foundExtra.Coordinates.slice(0, closest.index + 1);
    }
  }
  const Name = Begin
    ? closest.name.split(`-${path[0]}`)[0]
    : closest.name.split(`${path[path.length - 1]}-`)[1];
  const Docs = await db.getAllAsync(
    'SELECT * FROM routes WHERE "From" LIKE ? AND "To" = ?',
    Begin ? [Name, path[0]] : [path[path.length - 1], Name]
  );
  

  const Doc = Docs[0];
  const separated = [];
  Begin ? Doc.From = `Near ${pointName}`: Doc.To = `Near ${pointName}`;
  
  
  if (Doc && Doc.Vehicles) {
    const vehicles = Doc.Vehicles.replace(/[\[\]]/g, "")
      .split(",")
      .map((vehicle) => vehicle.trim())
      .filter(vehicle => vehicle.length > 0);
    
    for (const vehicle of vehicles) {
      separated.push({
        From: Doc.From,
        To: Doc.To,
        Vehicle: vehicle,
        distance: closest.length,
        used: false,
      });
    }
  }

    separated.push({
      From: Doc.From,
      To: Doc.To,
      Vehicle: "Walk",
      distance: closest.length,
      used: false,
    });
  return {
    length: closest.length,
    index: closest.index,
    cut: false,
    ExtraPolyline: ExtraPolyline,
    docs: separated,
    Name: Begin ? Doc.From: Doc.To
  };
};
export async function resolveShortUrl(shortUrl) {
  try {
    const response = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'manual', 
    });

    const fullUrl = response.headers.get('Location');
    if (fullUrl) {
      const regex = /3d(-?\d+\.\d+).*4d(-?\d+\.\d+)/;

  // Applying regex to the URL
       const match = fullUrl.match(regex);
       const latitude = match[1];
       const longitude = match[2];


      

      return {
          latitude: latitude,
          longitude: longitude
      };
    } else {
      console.log("No redirect found in the response.");
      return null;
    }
  } catch (error) {
    console.error("Error resolving short URL:", error);
    return null;
  }
}
