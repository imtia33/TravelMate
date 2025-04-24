
import { Client, Databases, Query,Storage } from 'react-native-appwrite';

const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('673bbe980022bc5d9813')
    .setPlatform('com.travx.axi');
     const database = new Databases(client);
     const storage = new Storage(client);

export const GetRoutes = async (offset) => {
  try {
    const result = await database.listDocuments(
      "673d6afb0008f18ba6a8",
      "673d6b1000120583a24f",
      [
        Query.limit(45),
        Query.offset(offset)
      ]
    );
    return result.documents;
     
  } catch (error) {
   
    return [];
  }
}
export const GetLocations = async (offset) => {
  try {
    const result = await database.listDocuments(
      "673d6afb0008f18ba6a8",
      "67519c950027be404119",
      [
        Query.limit(45),
        Query.offset(offset),
        Query.equal("single",true),
      ]
    );
    return result.documents;
     
  } catch (error) {
   
    return [];
  }
}
export const GetLocations2 = async (offset) => {
  try {
    const result = await database.listDocuments(
      "673d6afb0008f18ba6a8",
      "67965db70017ab374518",
      [
        Query.limit(45),
        Query.offset(offset),
      ]
    );
    return result.documents;
     
  } catch (error) {
   
    return [];
  }
}
export const Places = async (offset,district) => {
  try {
    const result = await database.listDocuments(
      "673d6afb0008f18ba6a8",
      district,
      [
        Query.limit(100),
        Query.offset(offset),
      ]
    );
    return result.documents;
     
  } catch (error) {
   
    return [];
  }
}
export const GetFares = async (offset) => {
  try {
    const result = await database.listDocuments(
      "673d6afb0008f18ba6a8",
      "67493aa600014faab652",
      [
        Query.limit(45),
        Query.offset(offset)
      ]
    );
    return result.documents;
     
  } catch (error) {
   
    return [];
  }
}
