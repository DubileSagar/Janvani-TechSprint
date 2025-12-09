export const cloudinaryService = {
    
    async uploadImage(file) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary credentials missing in .env");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'citizen_connect_reports'); 

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "Cloudinary upload failed");
            }

            const data = await response.json();
            return data.secure_url; 
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            throw error;
        }
    }
};
