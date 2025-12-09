import React, { useEffect, useState, useRef } from 'react';
import exifr from 'exifr';
import './Report.css';
import { dbService } from '../api/db';
import { analyzeImage } from '../api/ai';
import { detectAdministrativeArea, GIS_ERRORS } from '../api/gis';
import { civicIssues } from '../constants/civicIssues';
import VoiceInput from './VoiceInput';
import { useLanguage } from '../context/LanguageContext';

const Report = ({ currentUser }) => {
  console.log("Report component rendering...");
  const { language, isHindi, t } = useLanguage();
  try {
    
    
    

    const [formData, setFormData] = useState({
      title: '', 
      issueType: '',
      issue: '',
      image: null
    });
    const [userName, setUserName] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [coords, setCoords] = useState(null); 
    const [exifMessage, setExifMessage] = useState('');
    const [isParsingExif, setIsParsingExif] = useState(false);
    const [usedLiveLocation, setUsedLiveLocation] = useState(false);
    const [address, setAddress] = useState(null); 
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); 
    const [warningMessage, setWarningMessage] = useState(''); 

    



    


    const [gisLoading, setGisLoading] = useState(false);
    const [gisError, setGisError] = useState(null);
    const [gisData, setGisData] = useState(null);

    
    const [nearbyReports, setNearbyReports] = useState([]); 
    const [selectedExistingId, setSelectedExistingId] = useState(null); 
    const [isAiFilled, setIsAiFilled] = useState(false); 
    const [userUpvotes, setUserUpvotes] = useState(() => loadUserUpvotes()); 
    const [userDownvotes, setUserDownvotes] = useState(() => loadUserDownvotes()); 

    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [duplicateMatch, setDuplicateMatch] = useState(null); 
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

    
    useEffect(() => {
      if (currentUser) {
        setUserName(currentUser.name || 'Citizen');
      }
    }, [currentUser]);

    
    useEffect(() => {
      const initLocation = async () => {
        const loc = await tryGetLiveLocation();
        if (loc) {
          setCoords(loc);
          setUsedLiveLocation(true);
        }
      };
      initLocation();
    }, []);

    
    useEffect(() => {
      if (!coords) {
        setNearbyReports([]);
        return;
      }

      const fetchReports = async () => {
        const all = await dbService.getReports();
        const RADIUS_M = 1000; 
        const filtered = all
          .map(r => {
            
            
            let rCoords = r.coords;
            if (!rCoords && r.lat && r.lng) {
              rCoords = { lat: r.lat, lng: r.lng };
            } else if (typeof rCoords === 'string') {
              try { rCoords = JSON.parse(rCoords); } catch (e) { }
            }

            if (!rCoords) return null;

            return {
              ...r,
              coords: rCoords,
              id: r.$id, 
              _distanceMeters: distanceMeters(coords, rCoords)
            };
          })
          .filter(r => r && r._distanceMeters <= RADIUS_M)
          .filter(r => {
            if (!formData.issueType) return true;
            return String(r.issueTypeId || '') === String(formData.issueType);
          })
          
          .filter(r => !userUpvotes.includes(r.id) && !userDownvotes.includes(r.id))
          .sort((a, b) => a._distanceMeters - b._distanceMeters)
          .slice(0, 10);
        setNearbyReports(filtered);
      };

      
      fetchReports();
    }, [coords, formData.issueType]);

    
    const findNearbyReportsForCheck = async (checkCoords, issueTypeId = null) => {
      if (!checkCoords) return [];
      const all = await dbService.getReports(1000);
      const RADIUS_M = 150; 
      console.log("DEBUG: All reports count:", all.length);
      const candidates = all
        .map(r => {
          
          
          let rCoords = r.coords;
          if (!rCoords && r.lat && r.lng) {
            rCoords = { lat: r.lat, lng: r.lng };
          } else if (typeof rCoords === 'string') {
            try { rCoords = JSON.parse(rCoords); } catch (e) { }
          }
          if (!rCoords) return null;
          return {
            ...r,
            coords: rCoords,
            id: r.$id,
            _distanceMeters: distanceMeters(checkCoords, rCoords)
          };
        })
        .filter(r => r && r._distanceMeters <= RADIUS_M && r.imageId) 
        .filter(r => {
          
          if (!issueTypeId) return true;
          return String(r.issueTypeId || '') === String(issueTypeId);
        })
        .sort((a, b) => a._distanceMeters - b._distanceMeters)
        .slice(0, 5); 

      console.log("DEBUG: Candidates found for duplicate check:", candidates.map(c => ({ id: c.id, dist: c._distanceMeters, type: c.issueTypeId })));
      return candidates;
    };


    async function handleUpvote(id) {
      if (userUpvotes.includes(id)) {
        return;
      }

      const report = nearbyReports.find(r => r.id === id);
      if (!report) return;

      const hasDownvoted = userDownvotes.includes(id);

      
      const newUpvotes = (report.upvotes || 0) + 1;
      const newDownvotes = hasDownvoted ? Math.max((report.downvotes || 0) - 1, 0) : (report.downvotes || 0);

      setNearbyReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: newUpvotes, downvotes: newDownvotes } : r));

      
      const newUpvoteList = [...userUpvotes, id];
      saveUserUpvotes(newUpvoteList);
      setUserUpvotes(newUpvoteList);


      

      if (hasDownvoted) {
        const newDownvoteList = userDownvotes.filter(dId => dId !== id);
        saveUserDownvotes(newDownvoteList);
        setUserDownvotes(newDownvoteList);
      }

      setSelectedExistingId(id); 

      
      try {
        await dbService.updateReport(id, { upvotes: newUpvotes, downvotes: newDownvotes });
      } catch (error) {
        
        console.error("Upvote failed", error);
        setNearbyReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: report.upvotes, downvotes: report.downvotes } : r));
        setUserUpvotes(prev => prev.filter(uId => uId !== id)); 
      }
    }

    async function handleDownvote(id) {
      if (userDownvotes.includes(id)) {
        return;
      }

      const report = nearbyReports.find(r => r.id === id);
      if (!report) return;

      const hasUpvoted = userUpvotes.includes(id);
      
      const newDownvotes = (report.downvotes || 0) + 1;
      const newUpvotes = hasUpvoted ? Math.max((report.upvotes || 0) - 1, 0) : (report.upvotes || 0);

      setNearbyReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: newUpvotes, downvotes: newDownvotes } : r));

      
      const newDownvoteList = [...userDownvotes, id];
      saveUserDownvotes(newDownvoteList);
      setUserDownvotes(newDownvoteList);

      if (hasUpvoted) {
        const newUpvoteList = userUpvotes.filter(uId => uId !== id);
        saveUserUpvotes(newUpvoteList);
        setUserUpvotes(newUpvoteList);
      }

      setSelectedExistingId(id); 

      
      try {
        await dbService.updateReport(id, { downvotes: newDownvotes, upvotes: newUpvotes });
      } catch (error) {
        console.error("Downvote failed", error);
        
        setNearbyReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: report.upvotes, downvotes: report.downvotes } : r));
        setUserDownvotes(prev => prev.filter(dId => dId !== id)); 
      }
    }

    async function tryGetLiveLocation() {
      return new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      });
    }

    const handleInputChange = async (e) => {
      const { name, value, files } = e.target;
      const nextValue = files ? files[0] : value;
      setFormData(prev => ({
        ...prev,
        [name]: nextValue
      }));

      if (name === 'image' && files && files[0]) {
        
        processImage(files[0]);
      }
    };

    const processImage = async (file) => {
      
      setIsParsingExif(true);
      setExifMessage('Reading photo location…');
      
      
      setUsedLiveLocation(false);

      let newCoords = null;

      try {
        const gps = await exifr.gps(file);
        if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
          newCoords = { lat: gps.latitude, lng: gps.longitude };
          setCoords(newCoords);
          setExifMessage('Location found from photo.');
        } else {
          
          const live = await tryGetLiveLocation();
          if (live) {
            newCoords = live;
            setCoords(newCoords);
            setUsedLiveLocation(true);
            setExifMessage('Using current location (no GPS data in photo).');
          } else if (coords) {
            
            newCoords = coords;
            setExifMessage('Using previously detected location.');
          } else {
            setExifMessage('No GPS in photo and live location unavailable.');
          }
        }
      } catch (err) {
        console.error('EXIF parse error', err);
        const live = await tryGetLiveLocation();
        if (live) {
          newCoords = live;
          setCoords(live);
          setUsedLiveLocation(true);
          setExifMessage('Using current location (photo metadata unreadable).');
        } else if (coords) {
          
          newCoords = coords;
          setExifMessage('Using previously detected location.');
        } else {
          setExifMessage('Could not read photo location.');
        }
      } finally {
        setIsParsingExif(false);
      }

      
      setIsAnalyzing(true);
      let analysis = null;
      let aiFile = file;

      try {
        
        if (file.size > 1024 * 1024) {
          try {
            aiFile = await resizeImage(file);
          } catch (e) {
            console.warn("AI Resize failed, using original", e);
          }
        }

        
        analysis = await analyzeImage(aiFile, language === 'hi' ? 'hi' : 'en');
        

        if (analysis) {
          
          if (analysis.category === "Not a Civic Issue") {
            setWarningMessage("⚠️ This image does not appear to be related to a civic issue. Please upload a relevant photo.");
            setFormData(prev => ({ ...prev, image: null, title: '', issue: '', issueType: '' }));
            setCoords(null);
            setExifMessage('');
            return;
          }

          
          let matchedIssueId = '';
          let matchedIssueTitle = '';

          if (analysis.category) {
            const match = civicIssues.find(i =>
              i.title.toLowerCase() === analysis.category.toLowerCase() ||
              analysis.category.toLowerCase().includes(i.title.toLowerCase())
            );
            if (match) {
              matchedIssueId = match.id.toString();
              matchedIssueTitle = match.title;
            }
          }

          setFormData(prev => ({
            ...prev,
            title: analysis.title || prev.title,
            issue: analysis.description || prev.issue,
            issueType: matchedIssueId || prev.issueType
          }));

          if (matchedIssueTitle) {
            setSearchTerm(matchedIssueTitle);
          }

          setIsAiFilled(true);
          setTimeout(() => setIsAiFilled(false), 5000);
        }

      } catch (err) {
        console.error('AI error', err);
        if (err.message.includes("429") || err.message.includes("Quota")) {
          setWarningMessage("⚠️ AI usage limit reached for today. Please enter details manually.");
        } else {
          setWarningMessage("Could not analyze image. Please fill details manually.");
        }
      } finally {
        
        if (!analysis) {
          setIsAnalyzing(false);
          return;
        }
      }

      
      if (newCoords && analysis) {
        console.log("DEBUG: Starting duplicate check (Text) at coords:", newCoords);
        setIsCheckingDuplicate(true);
        try {
          const candidates = await findNearbyReportsForCheck(newCoords, formData.issueType); 
          if (candidates.length > 0) {
            console.log("DEBUG: Candidates exist, running Text comparison...");

            
            const { detectDuplicateText } = await import('../api/ai');

            
            const dupResult = await detectDuplicateText(analysis, candidates);
            console.log("DEBUG: AI Text Duplicate Result:", dupResult);

            if (dupResult.isDuplicate && dupResult.matchedIssueId) {
              const matchedIssue = candidates.find(c => c.id === dupResult.matchedIssueId);
              if (matchedIssue) {
                console.log("DEBUG: Sematic Match confirmed!", matchedIssue);
                setDuplicateMatch({ issue: matchedIssue, reason: dupResult.reason });
                setIsCheckingDuplicate(false);
                setIsAnalyzing(false);
                return; 
              }
            }
          } else {
            console.log("DEBUG: No nearby candidates found for duplicate check.");
          }
        } catch (dupErr) {
          console.warn("DEBUG: Duplicate check failed", dupErr);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }

      setIsAnalyzing(false);
    };

    
    useEffect(() => {
      let abort = false;

      
      async function reverseGeocode(lat, lng) {
        setIsResolvingAddress(true);
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
            console.warn("Google Maps API Key is missing");
            if (!abort) setAddress({ area: 'API Key Missing', city: '', postcode: '', state: '' });
            return;
          }

          const resp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
          const data = await resp.json();

          if (!resp.ok || data.status !== 'OK') {
            throw new Error(`Geocode failed: ${data.status}`);
          }

          if (abort) return;

          const result = data.results[0];
          if (result) {
            
            let streetNumber = '', route = '', neighborhood = '', sublocality = '';
            let city = '', postcode = '', state = '', district = '';
            let establishment = '', premise = '';

            result.address_components.forEach(comp => {
              if (comp.types.includes('street_number')) streetNumber = comp.long_name;
              if (comp.types.includes('route')) route = comp.long_name;
              if (comp.types.includes('neighborhood')) neighborhood = comp.long_name;
              if (comp.types.includes('sublocality')) sublocality = comp.long_name;
              if (comp.types.includes('establishment') || comp.types.includes('point_of_interest')) establishment = comp.long_name;
              if (comp.types.includes('premise') || comp.types.includes('subpremise')) premise = comp.long_name;

              if (comp.types.includes('administrative_area_level_2')) {
                district = comp.long_name;
              }
              if (comp.types.includes('locality')) {
                city = comp.long_name;
              }
              if (comp.types.includes('postal_code')) {
                postcode = comp.long_name;
              }
              if (comp.types.includes('administrative_area_level_1')) {
                state = comp.long_name;
              }
            });

            
            let areaParts = [];
            if (establishment) areaParts.push(establishment);
            if (premise) areaParts.push(premise);
            if (streetNumber) areaParts.push(streetNumber);
            if (route) areaParts.push(route);
            if (neighborhood) areaParts.push(neighborhood);
            if (sublocality) areaParts.push(sublocality);

            
            areaParts = [...new Set(areaParts)].filter(part => {
              if (!part) return false;
              const p = part.toLowerCase();
              return p !== city.toLowerCase() &&
                p !== state.toLowerCase() &&
                p !== district.toLowerCase() &&
                p !== postcode.toLowerCase();
            });

            let area = areaParts.join(', ');

            
            if ((!area || area.includes('+')) && result.formatted_address) {
              
              const parts = result.formatted_address.split(',').map(p => p.trim());

              
              const filteredParts = parts.filter(part => {
                const p = part.toLowerCase();
                const c = city.toLowerCase();
                const s = state.toLowerCase();
                const d = district.toLowerCase();
                const pc = postcode.toLowerCase();

                
                const isCity = c && (p === c || p.includes(c));
                const isState = s && (p === s || p.includes(s));
                const isDistrict = d && (p === d || p.includes(d));
                const isPostcode = pc && (p === pc || p.includes(pc));

                return !isCity && !isState && !isDistrict && !isPostcode;
              });

              if (filteredParts.length >= 2) {
                area = filteredParts.slice(0, 2).join(', ');
              } else if (filteredParts.length > 0) {
                area = filteredParts[0];
              }
            }

            setAddress({ area, city, district, postcode, state });
          }
        } catch (e) {
          console.error("Geocoding error:", e);
          if (!abort) setAddress(null);
        } finally {
          if (!abort) setIsResolvingAddress(false);
        }
      }

      
      async function fetchGisData(lat, lng) {
        setGisLoading(true);
        setGisError(null);
        setGisData(null);

        try {
          const result = await detectAdministrativeArea(lat, lng);
          if (!abort) {
            setGisData(result);
          }
        } catch (err) {
          console.error("GIS detection failed:", err);
          if (!abort) {
            setGisError(err.message || "Could not detect official area.");
          }
        } finally {
          if (!abort) setGisLoading(false);
        }
      }

      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        reverseGeocode(coords.lat, coords.lng);
        fetchGisData(coords.lat, coords.lng);
      } else {
        setAddress(null);
        setGisData(null);
      }
      return () => {
        abort = true;
      };
    }, [coords]);

    const startCamera = async () => {
      setWarningMessage(''); 
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setCameraStream(stream);
        setIsCameraOpen(true);
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions.");
      }
    };

    const stopCamera = () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCameraOpen(false);
    };

    const capturePhoto = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        
        canvas.toBlob(async (blob) => {
          const file = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });

          
          setFormData(prev => ({ ...prev, image: file }));
          stopCamera();

          
          await processImage(file);

        }, 'image/jpeg', 0.8);
      }
    };

    const retakePhoto = () => {
      setFormData(prev => ({ ...prev, image: null, title: '', issue: '' }));
      setCoords(null);
      setExifMessage('');
      startCamera();
    };

    const getGoogleMapsEmbedSrc = (lat, lng) => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`;
    };

    
    function distanceMeters(c1, c2) {
      if (!c1 || !c2) return Infinity;
      const R = 6371e3; 
      const φ1 = c1.lat * Math.PI / 180;
      const φ2 = c2.lat * Math.PI / 180;
      const Δφ = (c2.lat - c1.lat) * Math.PI / 180;
      const Δλ = (c2.lng - c1.lng) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    }

    function formatDistance(meters) {
      if (meters < 1000) return `${Math.round(meters)}m`;
      return `${(meters / 1000).toFixed(1)}km`;
    }

    function getCurrentUserPhone() {
      try {
        
        if (currentUser?.phone) {
          console.log('📱 Using phone from currentUser:', currentUser.phone);
          return currentUser.phone;
        }

        
        const user = JSON.parse(localStorage.getItem('cc_user'));
        const phone = user?.phone || localStorage.getItem('cc_user_phone');
        console.log('📱 Using phone from localStorage:', phone);
        return phone || '';
      } catch (e) {
        console.error('Error getting user phone:', e);
        return localStorage.getItem('cc_user_phone') || '';
      }
    }

    function loadUserUpvotes() {
      try {
        const stored = localStorage.getItem('cc_user_upvotes');
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        return [];
      }
    }

    function saveUserUpvotes(upvotes) {
      try {
        localStorage.setItem('cc_user_upvotes', JSON.stringify(upvotes));
      } catch (e) { }
    }

    
    async function handleDuplicateUpvote(duplicateIssue) {
      const issueId = duplicateIssue.id;

      
      if (userUpvotes.includes(issueId)) {
        console.log("Already upvoted this issue");
        return;
      }

      try {
        
        const currentIssue = await dbService.getReportById(issueId);
        if (!currentIssue) {
          console.error("Issue not found");
          return;
        }

        const hasDownvoted = userDownvotes.includes(issueId);
        const newUpvotes = (currentIssue.upvotes || 0) + 1;
        const newDownvotes = hasDownvoted ? Math.max((currentIssue.downvotes || 0) - 1, 0) : (currentIssue.downvotes || 0);

        
        await dbService.updateReport(issueId, {
          upvotes: newUpvotes,
          downvotes: newDownvotes
        });

        
        const newUpvoteList = [...userUpvotes, issueId];
        saveUserUpvotes(newUpvoteList);
        setUserUpvotes(newUpvoteList);

        if (hasDownvoted) {
          const newDownvoteList = userDownvotes.filter(dId => dId !== issueId);
          saveUserDownvotes(newDownvoteList);
          setUserDownvotes(newDownvoteList);
        }

        console.log(`✅ Upvoted duplicate issue ${issueId}`);
      } catch (error) {
        console.error("Failed to upvote duplicate issue:", error);
        alert("Failed to upvote. Please try again.");
      }
    }

    const dataURLToBlob = (dataURL) => {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    const resizeImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.8);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (selectedExistingId) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        return;
      }

      
      const selectedIssue = civicIssues.find(issue => issue.id === parseInt(formData.issueType));
      const issueTypeText = selectedIssue ? selectedIssue.title : 'Unknown Issue';

      
      try {
        if (coords) {
          let imageId = null;
          if (formData.image) {
            try {
              let fileToUpload = formData.image;

              if (typeof formData.image === 'string') {
                const blob = dataURLToBlob(formData.image);
                fileToUpload = new File([blob], `report_${Date.now()}.jpg`, { type: 'image/jpeg' });
              }

              
              try {
                if (fileToUpload instanceof File) {
                  fileToUpload = await resizeImage(fileToUpload);
                }
              } catch (resizeErr) {
                console.warn("Resize failed, using original", resizeErr);
              }

              const uploaded = await dbService.uploadImage(fileToUpload);
              imageId = uploaded.$id;
            } catch (imgErr) {
              console.error("Image upload failed:", imgErr);
              alert("Failed to upload image (Network Error). Creating report without image.");
              
              
            }
          }

          const newReport = {
            name: userName || 'Anonymous', 
            issueTypeId: formData.issueType || null,
            issueTitle: formData.title || issueTypeText, 
            description: formData.issue || '',
            lat: coords.lat,
            lng: coords.lng,
            address: address ? JSON.stringify(address) : null,
            
            gisData: gisData ? JSON.stringify(gisData) : null,
            
            district: (gisData && gisData.areaName) ? gisData.areaName : (address ? address.district : null),
            state: address ? address.state : null,
            upvotes: 0,
            status: 'open',
            reporterPhone: getCurrentUserPhone() || '',
            imageId: imageId, 
            reportDate: new Date().toISOString()
          };

          console.log('📝 Creating report with phone:', newReport.reporterPhone);
          console.log('👤 Current user phone:', currentUser?.phone);

          await dbService.createReport(newReport);
        }
      } catch (e) {
        console.error("Failed to create report", e);
        alert(`Failed to submit report: ${e.message || "Please check your connection."}`);
        return;
      }

      setFormData({ title: '', issueType: '', issue: '', image: null });
      setShowSuccess(true);
      setCoords(null);
      setExifMessage('');
      setUsedLiveLocation(false);
      setNearbyReports([]);
      setSelectedExistingId(null);
      setGisData(null); 

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    };

    return (
      <div className="report">
        <section className="report-form">
          <h1>Report a Civic Issue</h1>
          <form onSubmit={handleSubmit}>
            {}

            <label>Evidence Photo</label>

            {}
            <div className="camera-section">
              {!isCameraOpen && !formData.image && (
                <div className="camera-start">
                  <button type="button" className="btn-camera btn-primary" onClick={startCamera}>
                    📸 Take Real-time Photo
                  </button>
                  {}
                </div>
              )}

              {isCameraOpen && (
                <div className="camera-view">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
                  <div className="camera-controls">
                    <button type="button" className="btn-capture" onClick={capturePhoto}>Capture</button>
                    <button type="button" className="btn-cancel" onClick={stopCamera}>Cancel</button>
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                </div>
              )}

              {formData.image && !isCameraOpen && (
                <div className="photo-preview">
                  <img src={URL.createObjectURL(formData.image)} alt="Preview" className="preview-img" />
                  <div className="preview-actions">
                    <button type="button" className="btn-retake" onClick={retakePhoto}>Retake</button>
                  </div>
                  {(isAnalyzing || isCheckingDuplicate) && (
                    <div className="ai-loading">
                      <div className="spinner"></div>
                      <span>{isCheckingDuplicate ? "Checking for duplicates..." : (t('ai_analyzing') || "Analyzing...")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>


            {}
            {
              warningMessage && (
                <div className="warning-banner">
                  <span className="warning-icon">🚫</span>
                  <span className="warning-text">{warningMessage}</span>
                  <button type="button" className="warning-close" onClick={() => setWarningMessage('')}>×</button>
                </div>
              )
            }

            {
              (isParsingExif || exifMessage) && (
                <p className={`exif-status${coords ? ' success' : ''}`}>{isParsingExif ? 'Reading photo location…' : exifMessage}</p>
              )
            }

            {
              coords && (
                <div className="map-preview">
                  <div className="coords">
                    <span>Lat: {coords.lat.toFixed(6)}</span>
                    <span>Lng: {coords.lng.toFixed(6)}</span>
                    {usedLiveLocation && <span>(live)</span>}
                  </div>
                  {address && (
                    <div className="address">
                      <div className="address-line">Area/Locality: {address.area || '—'}</div>
                      <div className="address-line">City: {address.city || '—'}</div>
                      <div className="address-line">District: {address.district || '—'}</div>
                      <div className="address-line">Pincode: {address.postcode || '—'}</div>
                      <div className="address-line">State: {address.state || '—'}</div>
                    </div>
                  )}

                  {}
                  {gisLoading && <div className="gis-status">Fetching official area data...</div>}
                  {(gisData || (address && address.district)) && (
                    <div className={`gis-info ${gisData ? (gisData.confidence === 'low' ? 'gis-warning' : 'gis-success') : 'gis-warning'}`}>
                      <div className="gis-header">
                        <span className="gis-icon">🏛️</span>
                        <span className="gis-label">Official Administrative Area</span>
                      </div>
                      <div className="gis-content">
                        <div className="gis-main-value">{gisData ? gisData.areaName : address.district}</div>
                        <div className="gis-sub-value">{gisData ? gisData.areaType : 'District (Google Maps)'}</div>
                      </div>
                      {gisData && gisData.confidence === 'low' && (
                        <div className="gis-note">
                          Note: Location is near a boundary.
                          {gisData.alternatives && gisData.alternatives.length > 0 && (
                            <span> Alternatives: {gisData.alternatives.map(a => a.areaName).join(', ')}</span>
                          )}
                        </div>
                      )}
                      {!gisData && address.district && (
                        <div className="gis-note">
                          Note: Using Google Maps data (Official GIS unavailable).
                        </div>
                      )}
                    </div>
                  )}
                  {gisError && !address?.district && <div className="gis-error">GIS Error: {gisError}</div>}

                  {isResolvingAddress && <p className="exif-status">Resolving address…</p>}
                  <iframe
                    title="location-preview"
                    src={getGoogleMapsEmbedSrc(coords.lat, coords.lng)}
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <a
                    className="osm-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >Open in Google Maps</a>
                </div>
              )
            }

            <div className="label-row">
              <label htmlFor="title">Issue Title</label>
              {isAiFilled && <span className="ai-badge">✨ Auto-filled by AI</span>}
            </div>
            <VoiceInput
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={isHindi ? "उदा. मेन रोड पर बड़ा गड्ढा" : "e.g., Large Pothole on Main St"}
              required
              className="input"
              language={language}
            />

            <label htmlFor="issueType">{t('report_type_label')}</label>
            <div className="searchable-dropdown">
              <input
                type="text"
                placeholder={t('issues_search_placeholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                required
                className="input"
              />
              {isDropdownOpen && (
                <div className="dropdown-options">
                  {civicIssues
                    .filter(issue =>
                      t(`issue_${issue.id}_title`).toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(issue => (
                      <div
                        key={issue.id}
                        className="dropdown-item"
                        onClick={() => {
                          setFormData({ ...formData, issueType: issue.id.toString() });
                          setSearchTerm(t(`issue_${issue.id}_title`));
                          setIsDropdownOpen(false);
                        }}
                      >
                        {t(`issue_${issue.id}_title`)}
                      </div>
                    ))
                  }
                </div>
              )}
              <input
                type="hidden"
                name="issueType"
                value={formData.issueType}
                required
              />
            </div>

            <label htmlFor="issue">{t('report_desc_label')}</label>
            <VoiceInput
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleInputChange}
              placeholder={isHindi ? "समस्या का विवरण दें..." : "Describe the issue in detail..."}
              className="input"
              isTextArea={true}
              rows={5}
              language={isHindi ? 'hi-IN' : 'en-US'}
            />

            {
              coords && nearbyReports.length > 0 && (
                <div className="nearby-section">
                  <h3>{t('nearby_title') || 'Existing reports near you'}</h3>
                  <p>{t('nearby_desc') || 'See if one matches your issue. Upvote instead of creating a duplicate.'}</p>
                  <ul className="nearby-list">
                    {nearbyReports.map(r => (
                      <li key={r.id} className={`nearby-item${selectedExistingId === r.id ? ' selected' : ''}`}>
                        <div className="nearby-main">
                          <div className="nearby-title">{r.issueTitle}</div>
                          <div className="nearby-meta">
                            <span>{t('label_upvotes')}: {r.upvotes}</span>
                            <span>•</span>
                            <span>{formatDistance(r._distanceMeters)} {t('distance_away') || 'away'}</span>
                          </div>
                          {r.description && <div className="nearby-desc">{r.description}</div>}
                        </div>
                        <div className="nearby-actions">
                          <button type="button" className="btn upvote-btn" onClick={() => handleUpvote(r.id)} disabled={userUpvotes.includes(r.id)}>
                            {userUpvotes.includes(r.id) ? t('status_upvoted') : t('issue_upvote')}
                          </button>
                          <button type="button" className="btn downvote-btn" onClick={() => handleDownvote(r.id)} disabled={userDownvotes.includes(r.id)}>
                            {userDownvotes.includes(r.id) ? t('status_downvoted') : t('issue_downvote')}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {selectedExistingId && (
                    <p className="help-text">{t('upvote_thanks') || "Thanks for upvoting. You don't need to submit a duplicate report."}</p>
                  )}
                </div>
              )
            }

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!coords || isParsingExif || isAnalyzing || !formData.title || !formData.image || !!selectedExistingId}
            >
              {isAnalyzing ? t('analyzing') : t('report_submit_btn')}
            </button>
          </form >
          {showSuccess && (
            <div className="success-message">
              <p>Your report has been submitted successfully!</p>
            </div>
          )}
        </section >
        {}
        {
          duplicateMatch && (
            <div className="duplicate-overlay">
              <div className="duplicate-card">
                <h2>⚠️ Issue Already Reported!</h2>
                <p>We found a similar issue reported nearby.</p>

                <div className="comparison">
                  <div className="comp-item">
                    <span className="comp-label">Your Photo</span>
                    {formData.image && (
                      <img src={URL.createObjectURL(formData.image)} alt="Yours" />
                    )}
                  </div>
                  <div className="comp-item">
                    <span className="comp-label">Existing Issue</span>
                    {duplicateMatch.issue.imageId && (
                      <img src={dbService.getImageUrl(duplicateMatch.issue.imageId)} alt="Existing" />
                    )}
                  </div>
                </div>

                <div className="duplicate-reason">
                  <p><strong>Reason:</strong> {duplicateMatch.reason || "Visual match detected."}</p>
                  <p><strong>Title:</strong> {duplicateMatch.issue.issueTitle}</p>
                </div>

                <div className="duplicate-actions">
                  <button type="button" className="btn-upvote-duplicate" onClick={async () => {
                    await handleDuplicateUpvote(duplicateMatch.issue);
                    setShowSuccess(true);
                    setTimeout(() => {
                      setShowSuccess(false);
                      setDuplicateMatch(null);
                      retakePhoto();
                    }, 2000);
                  }}>
                    ▲ Upvote Existing Issue (+1)
                  </button>

                  <button type="button" className="btn-ignore-duplicate" onClick={() => {
                    setDuplicateMatch(null);
                  }}>
                    No, this is different
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    );
  } catch (err) {
    console.error("Report component crashed:", err);
    return <div style={{ padding: 20, color: 'red' }}>Something went wrong: {err.message}</div>;
  }
};

function getGoogleMapsEmbedSrc(lat, lng) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return '';
  }
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`;
}

export default Report;



function getCurrentUserPhone() {
  try {
    const phone = sessionStorage.getItem('cc_user_phone') || localStorage.getItem('cc_user_phone');
    return phone || '';
  } catch (_e) {
    return '';
  }
}

function loadUserUpvotes() {
  try {
    const raw = localStorage.getItem('cc_user_upvotes');
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch (_e) {
    return [];
  }
}

function saveUserUpvotes(ids) {
  try {
    localStorage.setItem('cc_user_upvotes', JSON.stringify(ids));
  } catch (_e) {
    
  }
}

function distanceMeters(a, b) {
  
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function loadUserDownvotes() {
  try {
    const raw = localStorage.getItem('cc_user_downvotes');
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch (_e) {
    return [];
  }
}

function saveUserDownvotes(ids) {
  try {
    localStorage.setItem('cc_user_downvotes', JSON.stringify(ids));
  } catch (_e) {
    
  }
}

function toRad(v) { return (v * Math.PI) / 180; }

function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
