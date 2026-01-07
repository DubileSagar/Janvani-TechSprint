import React, { useEffect, useRef, useState } from 'react';
import './IssueMap.css';
import { dbService } from '../api/db';

import { civicIssues } from '../constants/civicIssues';

const IssueMap = ({ reports }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [infoWindow, setInfoWindow] = useState(null);


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

        // Geolocation Logic - separate from init to ensure it runs
        const getUserLocation = (currentMap) => {
            if (navigator.geolocation && currentMap) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        console.log("IssueMap: User location found", pos);
                        currentMap.setCenter(pos);
                        currentMap.setZoom(14);

                        new window.google.maps.Marker({
                            position: pos,
                            map: currentMap,
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
                        map.setCenter(pos);
                        map.setZoom(14);

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

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                console.warn("Invalid coords for report:", report.$id);
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

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
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

    return (
        <div className="issue-map-container">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default IssueMap;
