import React, { useEffect, useRef, useState } from 'react';
import './IssueMap.css';
import { dbService } from '../api/db';

import { civicIssues } from '../constants/civicIssues';

const IssueMap = ({ reports }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [infoWindow, setInfoWindow] = useState(null);


    const [userLocation, setUserLocation] = useState(null);
    const [initialZoomDone, setInitialZoomDone] = useState(false);

    const defaultCenter = { lat: 16.3067, lng: 80.4365 };

    useEffect(() => {
        // Define initMap first so it's available
        const initMap = () => {
            if (!mapRef.current) return;

            const newMap = new window.google.maps.Map(mapRef.current, {
                center: defaultCenter,
                zoom: 10,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            setMap(newMap);
            setInfoWindow(new window.google.maps.InfoWindow());
        };

        // Geolocation Logic
        const getUserLocation = (currentMap) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        console.log("IssueMap: User location found", pos);
                        setUserLocation(pos);

                        if (currentMap) {
                            currentMap.setCenter(pos);
                            currentMap.setZoom(14); // Zoom in on user
                            setInitialZoomDone(true);
                        }

                        new window.google.maps.Marker({
                            position: pos,
                            map: currentMap || map,
                            title: "You are here",
                            icon: {
                                path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
                                fillColor: "#2962FF",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 2,
                                scale: 1.5,
                                anchor: new window.google.maps.Point(12, 12)
                            },
                            zIndex: 999
                        });
                    },
                    (error) => {
                        console.warn("IssueMap: Geolocation failed", error);
                    }
                );
            }
        };

        // Global Auth Failure Handler
        window.gm_authFailure = () => {
            console.error("Google Maps Auth Failure");
            // alert("Google Maps Error: The provided API Key is invalid or not authorized. Please check the browser console for details.");
        };

        // Load Script Logic
        if (window.google && window.google.maps) {
            initMap();
        } else {
            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.onload = initMap;
            script.onerror = () => {
                alert("Error: Google Maps script failed to load. Please check your internet connection.");
            };
            document.head.appendChild(script);
        }
    }, []);

    // Effect to trigger geolocation once map is ready
    useEffect(() => {
        if (map) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        setUserLocation(pos); // Save location state

                        if (!initialZoomDone) {
                            map.setCenter(pos);
                            map.setZoom(14);
                            setInitialZoomDone(true);
                        }

                        new window.google.maps.Marker({
                            position: pos,
                            map: map,
                            title: "You are here",
                            icon: {
                                path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
                                fillColor: "#2962FF",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 2,
                                scale: 1.5,
                                anchor: new window.google.maps.Point(12, 12)
                            },
                            zIndex: 999
                        });
                    },
                    (e) => console.warn("Geolocation failed later:", e)
                );
            }
        }
    }, [map]);


    useEffect(() => {
        if (!map || !reports.length) return;

        console.log(`IssueMap: Received ${reports.length} reports`);

        // Create bounds object
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidMarkers = false;

        markers.forEach(m => m.setMap(null));
        const newMarkers = [];

        reports.forEach(report => {
            let lat, lng;

            if (report.lat && report.lng) {
                lat = parseFloat(report.lat);
                lng = parseFloat(report.lng);
            } else if (report.coords) {
                try {
                    const c = typeof report.coords === 'string' ? JSON.parse(report.coords) : report.coords;
                    lat = parseFloat(c.lat);
                    lng = parseFloat(c.lng);
                } catch (e) { }
            }

            // Check for valid numbers, allowing 0
            if (lat === null || lat === undefined || isNaN(lat) || lng === null || lng === undefined || isNaN(lng)) {
                return;
            }

            let issueType = null;
            if (report.issueTypeId) {
                issueType = civicIssues.find(i => String(i.id) === String(report.issueTypeId));
            }

            if (!issueType) {
                issueType = civicIssues.find(i => i.title === report.issueTitle);
            }

            const color = issueType ? issueType.color : '#3b82f6';
            const markerColor = getMarkerColor(color);

            const position = { lat, lng };
            const marker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: report.issueTitle,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: markerColor,
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                }
            });

            // Add marker to bounds (but don't auto-fit unless user loc missing)
            bounds.extend(position);
            hasValidMarkers = true;

            marker.addListener('click', () => {
                const imageUrl = dbService.getImageUrl(report.imageId);
                const status = (report.status || 'open').toLowerCase();
                let statusColor = '#ef4444';
                let statusLabel = 'Open';

                if (status.includes('progress') || status === 'wip') {
                    statusColor = '#f59e0b';
                    statusLabel = 'In Progress';
                } else if (status === 'resolved') {
                    statusColor = '#10b981';
                    statusLabel = 'Resolved';
                }

                const contentString = `
          <div class="map-info-window" style="font-family: 'Outfit', sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <h3 style="margin:0; font-size:16px; color:#1e293b;">${report.issueTitle || 'Issue'}</h3>
                <span style="background-color:${statusColor}; color:white; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; text-transform:uppercase;">${statusLabel}</span>
            </div>
            ${imageUrl ? `<img src="${imageUrl}" alt="Issue" style="width:100%; max-height:150px; object-fit:cover; border-radius:6px; margin-bottom:8px;">` : ''}
            <p style="margin:0 0 8px 0; font-size:13px; color:#475569; line-height:1.4;">${report.description || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px solid #e2e8f0; padding-top:8px;">
                <small style="color:#94a3b8;">${new Date(report.$createdAt).toLocaleDateString()}</small>
                <a href="/issue/${report.$id}" style="color:#2563eb; text-decoration:none; font-size:13px; font-weight:500;">View Details →</a>
            </div>
          </div>
        `;

                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });

            newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        // Logic check: If user location is NOT found yet/ever, fallback to bounds
        if (hasValidMarkers && !initialZoomDone && !navigator.geolocation) {
            map.fitBounds(bounds);
        }

    }, [map, reports]);

    const getMarkerColor = (color) => {
        if (!color) return '#3b82f6';
        if (color.startsWith('#')) return color;


        if (color.includes('primary-dark')) return '#1e3a8a';
        if (color.includes('primary')) return '#3b82f6';
        if (color.includes('secondary-dark')) return '#b45309';
        if (color.includes('secondary')) return '#f59e0b';
        if (color.includes('accent')) return '#ef4444';
        return '#3b82f6';
    };

    const handleFindNearest = () => {
        if (!userLocation || !reports.length || !map) {
            alert("Waiting for user location or no reports available.");
            return;
        }

        let nearest = null;
        let minDistance = Infinity;

        // Simple Haversine or direct Euclidean (approx for small areas)
        // Using simple geometric distance for speed on client coords
        const rad = x => x * Math.PI / 180;
        const R = 6371; // Earth radius km

        reports.forEach(r => {
            let lat, lng;
            if (r.lat && r.lng) { lat = parseFloat(r.lat); lng = parseFloat(r.lng); }
            else if (r.coords) { try { const c = JSON.parse(r.coords); lat = c.lat; lng = c.lng; } catch (e) { } }

            if (!lat || !lng) return;

            const dLat = rad(lat - userLocation.lat);
            const dLon = rad(lng - userLocation.lng);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(userLocation.lat)) * Math.cos(rad(lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // Distance in km

            if (d < minDistance) {
                minDistance = d;
                nearest = { lat, lng, title: r.issueTitle };
            }
        });

        if (nearest) {
            map.setCenter({ lat: nearest.lat, lng: nearest.lng });
            map.setZoom(16); // Close up on the issue
            // Optional: trigger click on marker if we could match it, or just show a new info window? 
            // For now, just centering is good.
            new window.google.maps.InfoWindow({
                content: `<div style="padding:5px"><b>Nearest Issue (~${minDistance.toFixed(2)}km)</b><br/>${nearest.title}</div>`,
                position: { lat: nearest.lat, lng: nearest.lng }
            }).open(map);
        } else {
            alert("No nearby issues found.");
        }
    };

    return (
        <div className="issue-map-container" style={{ position: 'relative' }}>
            <button
                onClick={handleFindNearest}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    backgroundColor: '#2563EB', // Bright Blue
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.5)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
                }}
            >
                <span>📍</span>
                Show Nearest Issue
            </button>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default IssueMap;
