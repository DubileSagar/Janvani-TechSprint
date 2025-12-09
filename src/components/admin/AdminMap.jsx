import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../api/db';
import { civicIssues } from '../../constants/civicIssues';

const AdminMap = ({ reports }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [infoWindow, setInfoWindow] = useState(null);
    const navigate = useNavigate();

    
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState(['new', 'in-progress', 'resolved', 'rejected']);
    const [selectedDistricts, setSelectedDistricts] = useState([]);
    const [availableDistricts, setAvailableDistricts] = useState([]);

    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [colorMode, setColorMode] = useState('status'); 

    
    
    

    const statusOptions = [
        { id: 'new', label: 'New / Open', color: '#3B82F6' },
        { id: 'in-progress', label: 'In Progress', color: '#F59E0B' },
        { id: 'resolved', label: 'Resolved', color: '#10B981' },
        { id: 'rejected', label: 'Rejected', color: '#EF4444' }
    ];

    const normalizeDistrict = (d) => {
        if (!d) return 'Unknown';
        const str = d.toString().trim().toLowerCase();
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    
    useEffect(() => {
        
        setSelectedTypes(civicIssues.map(i => i.id.toString()));

        
        if (reports && reports.length > 0) {
            const districts = [...new Set(reports.map(r => normalizeDistrict(r.district)))].sort();
            setAvailableDistricts(districts);
            setSelectedDistricts(districts);
        }
    }, [reports]);

    
    const defaultCenter = { lat: 17.3850, lng: 78.4867 }; 

    useEffect(() => {
        const loadScript = () => {
            if (window.google && window.google.maps) {
                initMap();
                return;
            }

            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.onload = initMap;
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!mapRef.current) return;

            const newMap = new window.google.maps.Map(mapRef.current, {
                center: defaultCenter,
                zoom: 6,
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

        loadScript();
    }, []);

    const getReportStatusId = (status) => {
        const s = (status || 'new').toLowerCase().trim();
        if (s === 'resolved') return 'resolved';
        if (s === 'in progress' || s === 'in-progress') return 'in-progress';
        if (s === 'rejected') return 'rejected';
        return 'new';
    };

    
    useEffect(() => {
        if (!map || !reports.length) return;

        
        markers.forEach(m => m.setMap(null));
        const newMarkers = [];
        const bounds = new window.google.maps.LatLngBounds();

        console.log("AdminMap: Reports received:", reports.length);
        console.log("AdminMap: Selected Districts:", selectedDistricts);

        reports.forEach(report => {
            
            const dist = normalizeDistrict(report.district);
            if (!selectedDistricts.includes(dist)) {
                
                return;
            }

            
            const statusId = getReportStatusId(report.status);
            if (!selectedStatuses.includes(statusId)) return;

            
            let shouldShow = false;
            let issueId = null;

            
            let typeIdStr = report.issueTypeId ? report.issueTypeId.toString() : null;
            const knownIds = civicIssues.map(i => i.id.toString());

            
            if (typeIdStr && !knownIds.includes(typeIdStr)) {
                typeIdStr = '17';
            }

            if (typeIdStr && selectedTypes.includes(typeIdStr)) {
                shouldShow = true;
                issueId = parseInt(typeIdStr);
            } else if (!typeIdStr) {
                
                const match = civicIssues.find(i => i.title === report.issueTitle);
                if (match && selectedTypes.includes(match.id.toString())) {
                    shouldShow = true;
                    issueId = match.id;
                } else if (!match && selectedTypes.includes('17')) { 
                    shouldShow = true;
                    issueId = 17;
                }
            }

            if (!shouldShow) return;

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
                console.warn(`Skipping report ${report.$id}: Invalid coordinates`, { lat, lng });
                return;
            }

            
            bounds.extend({ lat, lng });

            
            let markerColor;
            if (colorMode === 'status') {
                markerColor = getStatusColor(report.status);
            } else {
                
                const issue = civicIssues.find(i => i.id === issueId);
                markerColor = issue ? issue.color : '#6b7280';
            }

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: report.issueTitle,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: markerColor,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                }
            });

            marker.addListener('click', () => {
                const imageUrl = dbService.getImageUrl(report.imageId);
                const contentString = `
                    <div style="min-width: 200px; font-family: sans-serif;">
                        <h3 style="margin: 0 0 8px; font-size: 16px;">${report.issueTitle || 'Issue'}</h3>
                        <div style="margin-bottom: 8px;">
                            <span style="background: ${getStatusColor(report.status)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                                ${report.status || 'New'}
                            </span>
                            <span style="color: #666; font-size: 12px; margin-left: 8px;">
                                ${new Date(report.$createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">` : ''}
                        <p style="margin: 0 0 8px; font-size: 13px; color: #333;">${report.description || ''}</p>
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            <strong>District:</strong> ${report.district || 'N/A'}
                        </p>
                    </div>
                `;

                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });

            newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        
        if (newMarkers.length > 0) {
            map.fitBounds(bounds);
            
            const listener = window.google.maps.event.addListener(map, "idle", () => {
                if (map.getZoom() > 14) map.setZoom(14);
                window.google.maps.event.removeListener(listener);
            });
        }

    }, [map, reports, selectedTypes, selectedStatuses, selectedDistricts, colorMode]);

    const getStatusColor = (status) => {
        const id = getReportStatusId(status);
        const opt = statusOptions.find(o => o.id === id);
        return opt ? opt.color : '#3B82F6';
    };

    const toggleType = (id) => {
        const strId = id.toString();
        setSelectedTypes(prev => {
            const newTypes = prev.includes(strId)
                ? prev.filter(t => t !== strId)
                : [...prev, strId];

            
            if (newTypes.length < civicIssues.length) {
                setColorMode('type');
            }
            return newTypes;
        });
    };

    const toggleStatus = (id) => {
        setSelectedStatuses(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const toggleDistrict = (dist) => {
        setSelectedDistricts(prev =>
            prev.includes(dist)
                ? prev.filter(d => d !== dist)
                : [...prev, dist]
        );
    };

    const toggleAllTypes = () => {
        if (selectedTypes.length === civicIssues.length) {
            setSelectedTypes([]);
        } else {
            setSelectedTypes(civicIssues.map(i => i.id.toString()));
        }
    };

    const toggleAllDistricts = () => {
        if (selectedDistricts.length === availableDistricts.length) {
            setSelectedDistricts([]);
        } else {
            setSelectedDistricts([...availableDistricts]);
        }
    };

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
            {}
            <div ref={mapRef} style={{ flex: 1, height: '100%' }} />

            {}
            <div style={{
                width: isFilterOpen ? '280px' : '0',
                background: 'white',
                borderLeft: '1px solid #e2e8f0',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 10
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', minWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Map Controls</h4>
                    </div>

                    {}
                    <button
                        onClick={() => navigate('/custom-report', {
                            state: {
                                filters: {
                                    districts: selectedDistricts,
                                    statuses: selectedStatuses,
                                    types: selectedTypes
                                }
                            }
                        })}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            marginBottom: '1rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>📊</span> Generate Report
                    </button>

                    {}
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', color: '#64748b' }}>COLOR MARKERS BY:</div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="colorMode"
                                    value="status"
                                    checked={colorMode === 'status'}
                                    onChange={() => setColorMode('status')}
                                    style={{ marginRight: '4px' }}
                                />
                                Status
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="colorMode"
                                    value="type"
                                    checked={colorMode === 'type'}
                                    onChange={() => setColorMode('type')}
                                    style={{ marginRight: '4px' }}
                                />
                                Issue Type
                            </label>
                        </div>
                    </div>

                    {}
                    {colorMode === 'status' && (
                        <div style={{ marginBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', color: '#64748b' }}>FILTER STATUS:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {statusOptions.map(opt => (
                                    <label key={opt.id} style={{
                                        display: 'flex', alignItems: 'center', fontSize: '0.8rem',
                                        padding: '4px 8px', borderRadius: '12px',
                                        background: selectedStatuses.includes(opt.id) ? opt.color + '20' : '#f1f5f9',
                                        border: `1px solid ${selectedStatuses.includes(opt.id) ? opt.color : '#e2e8f0'}`,
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(opt.id)}
                                            onChange={() => toggleStatus(opt.id)}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: opt.color, marginRight: '6px'
                                        }} />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {}
                    {availableDistricts.length > 1 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>FILTER DISTRICTS:</div>
                                <button onClick={toggleAllDistricts} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    {selectedDistricts.length === availableDistricts.length ? 'Clear' : 'All'}
                                </button>
                            </div>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0.5rem' }}>
                                {availableDistricts.map(dist => (
                                    <div key={dist} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <input
                                            type="checkbox"
                                            id={`dist-${dist}`}
                                            checked={selectedDistricts.includes(dist)}
                                            onChange={() => toggleDistrict(dist)}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        <label htmlFor={`dist-${dist}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                            {dist}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', minWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>FILTER TYPES:</div>
                        <button onClick={toggleAllTypes} style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {selectedTypes.length === civicIssues.length ? 'Clear' : 'All'}
                        </button>
                    </div>
                    {civicIssues.map(issue => (
                        <div key={issue.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id={`filter-${issue.id}`}
                                checked={selectedTypes.includes(issue.id.toString())}
                                onChange={() => toggleType(issue.id)}
                                style={{ marginRight: '0.5rem' }}
                            />
                            <label htmlFor={`filter-${issue.id}`} style={{ fontSize: '0.9rem', cursor: 'pointer', flex: 1 }}>
                                {issue.title}
                            </label>
                            {colorMode === 'type' && (
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: issue.color, marginLeft: 'auto' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {}
            <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: isFilterOpen ? '290px' : '10px',
                    zIndex: 11,
                    background: 'white',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'right 0.3s ease'
                }}
            >
                {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminMap;
