
import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
  } from "react-native-appwrite";
  
  export const appwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.travelmate.axi",
    projectId: "673bbe980022bc5d9813",
    databaseId: "673d6afb0008f18ba6a8",
    userCollectionId: "6752f8580012fcdb1826",
    RouteCollectionId: "673d6b1000120583a24f", 
    LocationCollectionId: "67519c950027be404119",
    FareCollectionId: "67493aa600014faab652",
    DistrictCollectionId:"67530cfd0039fa5cc9ba"
  };
  
  const client = new Client();
  const databases = new Databases(client);
  
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);
  
  const account = new Account(client);
  const storage = new Storage(client);
  const avatars = new Avatars(client);
    
  export async function createUser(
    email,
    password,
    username,
    location,
    Lat,
    Long,
    bbox
  ) {
    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username
      );
  
      if (!newAccount) throw Error;

      const avatarUrl = avatars.getInitials(username);
  
      await signIn(email, password);
  
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email: email,
          username: username,
          avatar: avatarUrl,
          District: location,
          Lat: Lat,
          Long: Long,
          bbox:bbox
        }
      );
  
      return newUser;
    } catch (error) {
      throw new Error(error);
    }
  }
  export async function signIn(email, password) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }
  export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  export async function getCurrentUser() {
    try {
      const currentAccount = await getAccount();
      if (!currentAccount) throw Error;
  
      const currentUser = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );
  
      if (!currentUser) throw Error;
  
      return currentUser.documents[0];
    } catch (error) {
      return null;
    }
  }
  export async function signOut() {
    try {
      const session = await account.deleteSession("current");

      return session;
    } catch (error) {

      throw new Error(error);
    }
  }
  //forgot password
  export const checklastrecoveryMail=async(email)=>{
    const query = [
      Query.equal("email", email),
      Query.select(["ForgotPasswordLastTime", "$id"]),
      Query.limit(1)
    ];
    const check = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId, query);
    return check;
  }
  export const sendMail = async (email,id) => {
    const recoveryUrl = "https://travelmate-axi.web.app/verifying";
        try {
          const res = await account.createRecovery(email, recoveryUrl);
          if (res) {
            await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.userCollectionId, id, {
              ForgotPasswordLastTime: res.$createdAt
            });
          }
          return res;
        } catch (error) {
          console.error(error);
          throw new Error("Failed to send recovery email");
        }
      
  };
  //reset password
  export const resetPass = async (id, sec, pass, repass) => {
    try {
     const res= await account.updateRecovery(id, sec, pass, repass);
     return res;
    } catch (error) {

    }
};
  export const updateData = async (name, number, location, uid, motto) => {
    try {
      const result=await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        uid,
        {
          username: name,
          location: location,
          number: number,
          motto: motto,
        }
      );
      return result;
    } catch (error) {
      throw new Error("Failed to update message");
    }
  };
  export const GetLocations = async () => {
    try {
      const locations = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.DistrictCollectionId
      );
      return locations.documents;
    } catch (error) {
      throw new Error("Failed to get locations");
    }
  }
  export const getvehcileImage=async(vehicle)=>{
    try {
      const image = await databases.listDocuments(appwriteConfig.databaseId,"67aeddb9002038b270f9",[
        Query.equal("Name",vehicle),
        Query.limit(1)
      ])
      
      return image.documents[0].Image;
    } catch (error) {
      throw new Error("Failed to get image");
    }
  }
  export async function getPlaceDetails(lat, lon) {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&limit=1&lang=en`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features.length === 0) {
            return null; // No results found
        }
       
        const place = data.features[0]; // Take the first result
        
        // Construct the response to match Nominatim's format
        const formattedData = {
            display_name: place.properties.name || "",
            address: {
                state_district: place.properties.city || "",
            },
            lat: String(place.geometry.coordinates[1]), // Convert to string to match Nominatim
            lon: String(place.geometry.coordinates[0]), // Convert to string to match Nominatim
        };

        return formattedData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

  export const getAdvertisements = async () => {
    const res= await databases.listDocuments(appwriteConfig.databaseId,"67b6fa89003d1b45a677",[
      Query.limit(5)
    ]);
    return res.documents;
  }
  export const getvisitingPlaces = async () => {
    const res= await databases.listDocuments(appwriteConfig.databaseId,"VPChittagong",[
      Query.limit(5)
    ]);
    return res.documents;
  }