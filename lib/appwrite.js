
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
    Long
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
          Long: Long
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
  export const deleteChat=async(id)=>{
    let imageUrl;
    const chat = await databases.getDocument(appwriteConfig.databaseId,appwriteConfig.groupChat,id);
    imageUrl=chat.image;
    await databases.deleteDocument(appwriteConfig.databaseId,appwriteConfig.groupChat,id);
    if(imageUrl){
    const images=await databases.getDocument(appwriteConfig.databaseId,appwriteConfig.imageCollection,
      [
        Query.equal("image",imageUrl)
      ]
    )
    await storage.deleteFile(appwriteConfig.storageBucket,images.documents[0].$id);
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
  export const sendMail = async (email) => {
     const recoveryUrl = "https://travelmate-axi.web.app/verifying";
    // const recoveryUrl = "travelmate://verifying";
    try {
      const res=await account.createRecovery(email, recoveryUrl);
      //console.log(res);
    } catch (error) {
      console.log(error);
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