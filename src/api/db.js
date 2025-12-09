import { databases, storage } from '../appwrite';
import { ID, Query } from 'appwrite';
import { cloudinaryService } from './cloudinary';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID_REPORTS; 
const TABLE_ID_USERS = 'tb_users'; 
const STATE_DB_ID = '69306f670031d80567e0';
const TABLE_ID_AP_REPORTS = 'ap_reports';
const TABLE_ID_JH_REPORTS = 'jharkhand_reports';

export const dbService = {
    
    async _findUser(phone) {
        try {
            const cleanPhone = String(phone).replace(/\D/g, '');
            const variants = [];
            if (cleanPhone.length > 0) variants.push(cleanPhone);
            if (cleanPhone.length === 10) variants.push(`+91${cleanPhone}`);
            if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                variants.push(`+${cleanPhone}`);
                variants.push(cleanPhone.substring(2));
            }
            variants.push(phone);
            const uniqueVariants = [...new Set(variants)];

            const promises = uniqueVariants.map(p =>
                databases.listDocuments(DB_ID, TABLE_ID_USERS, [Query.equal('phone', p)])
            );
            const results = await Promise.all(promises);
            
            const found = results.find(r => r.documents.length > 0);
            return found ? found.documents[0] : null;
        } catch (error) {
            console.error("Error finding user variant:", error);
            return null;
        }
    },

    
    async checkUserExists(phone) {
        
        
        const user = await this._findUser(phone);
        return !!user;
    },

    
    async createUser(phone, name) {
        try {
            return await databases.createDocument(
                DB_ID,
                TABLE_ID_USERS,
                ID.unique(),
                { phone, name, points: 0 }
            );
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    
    async syncUser(authUser) {
        try {
            const phone = authUser.phone;
            if (!phone) return null;

            
            const users = await databases.listDocuments(
                DB_ID,
                TABLE_ID_USERS,
                [Query.equal('phone', phone)]
            );

            if (users.documents.length > 0) {
                
                const doc = users.documents[0];
                if (doc.points === undefined || doc.points === null) {
                    await databases.updateDocument(DB_ID, TABLE_ID_USERS, doc.$id, { points: 0 });
                }
                return doc;
            } else {
                
                console.log("Syncing user to DB:", phone);
                return await databases.createDocument(
                    DB_ID,
                    TABLE_ID_USERS,
                    authUser.id || ID.unique(), 
                    {
                        phone: phone,
                        name: authUser.user_metadata?.display_name || 'Citizen',
                        email: authUser.email || '',
                        points: 0,
                        state: authUser.user_metadata?.state || '',
                        district: authUser.user_metadata?.district || '',
                        age: authUser.user_metadata?.age || '',
                        gender: authUser.user_metadata?.gender || '',
                        isProfileComplete: !!authUser.user_metadata?.display_name
                    }
                );
            }
        } catch (error) {
            console.error("Sync user error:", error);
            
            return null;
        }
    },

    
    async getUserByPhone(phone) {
        return await this._findUser(phone);
    },

    
    async addPointsToUser(phone, pointsToAdd) {
        try {
            console.log(`Rewarding ${pointsToAdd} points to ${phone}`);
            
            const userDoc = await this._findUser(phone);

            if (!userDoc) {
                console.error("User not found for reward:", phone);
                return false;
            }

            const currentPoints = userDoc.points || 0;
            const newPoints = currentPoints + pointsToAdd;

            
            await databases.updateDocument(
                DB_ID,
                TABLE_ID_USERS,
                userDoc.$id,
                { points: newPoints }
            );

            console.log(`User ${phone} rewarded. New Balance: ${newPoints}`);
            return true;
        } catch (error) {
            console.error("Error adding points:", error);
            return false;
        }
    },

    
    async deductPointsFromUser(phone, pointsToDeduct) {
        try {
            console.log(`Deducting ${pointsToDeduct} points from ${phone}`);

            const userDoc = await this._findUser(phone);
            if (!userDoc) {
                console.error("User not found for deduction:", phone);
                throw new Error("User not found");
            }

            const currentPoints = userDoc.points || 0;
            if (currentPoints < pointsToDeduct) {
                throw new Error("Insufficient balance");
            }

            const newPoints = currentPoints - pointsToDeduct;

            await databases.updateDocument(
                DB_ID,
                TABLE_ID_USERS,
                userDoc.$id,
                { points: newPoints }
            );

            console.log(`User ${phone} deduction successful. New Balance: ${newPoints}`);
            return { success: true, newBalance: newPoints };
        } catch (error) {
            console.error("Error deducting points:", error);
            return { success: false, error: error.message };
        }
    },

    
    async createReport(data) {
        try {
            
            const payload = {
                ...data,
                reportDate: new Date().toISOString()
            };

            const response = await databases.createDocument(
                DB_ID,
                TABLE_ID,
                ID.unique(),
                payload
            );

            
            console.log("Checking state for dual-write:", data.state);
            if (data.state) {
                let stateTableId = null;
                const stateLower = data.state.toLowerCase();

                if (stateLower.includes('andhra pradesh')) {
                    stateTableId = TABLE_ID_AP_REPORTS;
                } else if (stateLower.includes('jharkhand')) {
                    stateTableId = TABLE_ID_JH_REPORTS;
                }

                console.log("Determined State Table ID:", stateTableId);

                if (stateTableId) {
                    try {
                        console.log(`Attempting to write to DB: ${STATE_DB_ID}, Collection: ${stateTableId}`);

                        
                        
                        
                        const { gisData, reporterName, reporterPhone, status, ...rest } = data;

                        
                        const stateData = {
                            ...rest,
                            lat: String(rest.lat),
                            lng: String(rest.lng),
                            issueTypeId: String(rest.issueTypeId),
                            upvotes: Number(rest.upvotes || 0),
                            downvotes: Number(rest.downvotes || 0)
                        };

                        console.log("State Payload:", JSON.stringify(stateData));

                        await databases.createDocument(
                            STATE_DB_ID,
                            stateTableId,
                            ID.unique(),
                            stateData
                        );
                        console.log(`Report copied to ${stateTableId} in DB ${STATE_DB_ID}`);
                    } catch (stateErr) {
                        console.error(`Failed to copy report to state DB (${stateTableId}):`, stateErr);
                        
                    }
                }
            }

            return response;
        } catch (error) {
            console.error("Error creating report:", error);
            if (error.response) {
                console.error("Appwrite Error Response:", error.response);
            }
            throw error;
        }
    },

    
    async getReports(limit = 50) {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                TABLE_ID,
                [
                    Query.orderDesc('$createdAt'),
                    Query.limit(limit)
                ]
            );
            return response.documents;
        } catch (error) {
            console.error("Error fetching reports:", error);
            return [];
        }
    },

    
    async updateReport(id, data) {
        try {
            return await databases.updateDocument(
                DB_ID,
                TABLE_ID,
                id,
                data
            );
        } catch (error) {
            console.error("Error updating report:", error);
            throw error;
        }
    },

    
    async getReportsByUser(phone) {
        try {
            
            const cleanPhone = String(phone).replace(/\D/g, '');
            
            const variants = [];

            
            if (cleanPhone.length > 0) variants.push(cleanPhone);

            
            if (cleanPhone.length === 10) {
                variants.push(`+91${cleanPhone}`);
            }

            
            if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                variants.push(`+${cleanPhone}`); 
                variants.push(cleanPhone.substring(2)); 
            }

            
            variants.push(phone);

            
            const uniqueVariants = [...new Set(variants)];

            const promises = uniqueVariants.map(p =>
                databases.listDocuments(DB_ID, TABLE_ID, [Query.equal('reporterPhone', p), Query.orderDesc('$createdAt')])
            );

            const results = await Promise.all(promises);
            
            const allDocs = results.flatMap(r => r.documents);
            const seen = new Set();
            return allDocs.filter(doc => {
                const duplicate = seen.has(doc.$id);
                seen.add(doc.$id);
                return !duplicate;
            });
        } catch (error) {
            console.error("Error fetching user reports:", error);
            return [];
        }
    },

    
    async getReport(id) {
        try {
            return await databases.getDocument(
                DB_ID,
                TABLE_ID,
                id
            );
        } catch (error) {
            console.error("Error fetching report:", error);
            throw error;
        }
    },

    
    async getReportById(id) {
        return await this.getReport(id);
    },



    

    
    async uploadImage(file) {
        try {
            const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
            if (!BUCKET_ID) throw new Error("Bucket ID not configured");

            return await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                file
            );
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    },

    
    getImageUrl(fileId) {
        const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
        if (!BUCKET_ID || !fileId) return null;
        return storage.getFileView(BUCKET_ID, fileId);
    },

    
    async deleteReport(id, imageId) {
        try {
            
            if (imageId) {
                const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;
                if (BUCKET_ID) {
                    try {
                        await storage.deleteFile(BUCKET_ID, imageId);
                    } catch (e) {
                        console.error("Error deleting image:", e);
                        
                    }
                }
            }

            
            await databases.deleteDocument(
                DB_ID,
                TABLE_ID,
                id
            );
            return true;
        } catch (error) {
            console.error("Error deleting report:", error);
            throw error;
        }
    }
};
