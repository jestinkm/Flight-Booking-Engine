import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Plane,
  Calendar,
  Layers,
  Ticket,
  Users,
  Tag,
  BarChart2,
  HelpCircle,
  Shield,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Eye,
  Loader2,
  Power,
  RefreshCw,
  Clock,
  MapPin,
  Check,
  X,
  Info,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import SeatMapComponent from '../../components/SeatMapComponent';
import Modal from '../../components/Modal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import RevenueAnalyticsTab from '../../components/admin/RevenueAnalyticsTab';

const FALLBACK_AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi Intl Airport', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl Airport', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda Intl Airport', city: 'Bengaluru', country: 'India' },
  { code: 'MAA', name: 'Chennai Intl Airport', city: 'Chennai', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl Airport', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl Airport', city: 'Kolkata', country: 'India' },
  { code: 'COK', name: 'Cochin Intl Airport', city: 'Kochi', country: 'India' },
  { code: 'GOI', name: 'Dabolim Airport (Goa Intl)', city: 'Goa', country: 'India' },
  { code: 'GOX', name: 'Manohar Intl Airport (Mopa)', city: 'North Goa', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl Airport', city: 'Ahmedabad', country: 'India' },
  { code: 'PNQ', name: 'Pune Intl Airport', city: 'Pune', country: 'India' },
  { code: 'JAI', name: 'Jaipur Intl Airport', city: 'Jaipur', country: 'India' },
  { code: 'LKO', name: 'Chaudhary Charan Singh Intl Airport', city: 'Lucknow', country: 'India' },
  { code: 'TRV', name: 'Thiruvananthapuram Intl Airport', city: 'Thiruvananthapuram', country: 'India' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi Intl Airport', city: 'Guwahati', country: 'India' },
  { code: 'IXB', name: 'Bagdogra Airport', city: 'Siliguri', country: 'India' },
  { code: 'IXC', name: 'Shaheed Bhagat Singh Intl Airport', city: 'Chandigarh', country: 'India' },
  { code: 'VNS', name: 'Lal Bahadur Shastri Intl Airport', city: 'Varanasi', country: 'India' },
  { code: 'BBI', name: 'Biju Patnaik Intl Airport', city: 'Bhubaneswar', country: 'India' },
  { code: 'PAT', name: 'Jay Prakash Narayan Intl Airport', city: 'Patna', country: 'India' },
  { code: 'SXR', name: 'Sheikh ul-Alam Intl Airport', city: 'Srinagar', country: 'India' },
  { code: 'IXZ', name: 'Veer Savarkar Intl Airport', city: 'Port Blair', country: 'India' },
  { code: 'DXB', name: 'Dubai Intl Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { code: 'JFK', name: 'John F. Kennedy Intl Airport', city: 'New York', country: 'United States' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { code: 'DOH', name: 'Hamad Intl Airport', city: 'Doha', country: 'Qatar' },
  { code: 'KUL', name: 'Kuala Lumpur Intl Airport', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France' }
];

const INITIAL_ADMINS = [
  { id: 'ADM-1', name: 'Root Super Admin', email: 'superadmin@skynexa.com', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  { id: 'ADM-2', name: 'Schedule Manager', email: 'scheduleadmin@skynexa.com', role: 'SCHEDULE_ADMIN', status: 'ACTIVE' },
  { id: 'ADM-3', name: 'Marketing Director', email: 'marketingadmin@skynexa.com', role: 'MARKETING_ADMIN', status: 'ACTIVE' }
];

const INITIAL_LOGS = [
  { id: 'LOG-1', action: 'Flight Created', details: 'Added SK-101 Chennai → Bengaluru', user: 'superadmin@skynexa.com', time: '10 mins ago' },
  { id: 'LOG-2', action: 'Fare Updated', details: 'SK-204 DEL → BOM base fare updated to ₹5,800', user: 'scheduleadmin@skynexa.com', time: '1 hour ago' },
  { id: 'LOG-3', action: 'Offer Published', details: 'Created SKY500 flat ₹500 discount campaign', user: 'marketingadmin@skynexa.com', time: '4 hours ago' },
  { id: 'LOG-4', action: 'Seat Map Configured', details: 'Airbus A320 3-3 layout updated to 30 rows', user: 'superadmin@skynexa.com', time: 'Yesterday' }
];

const SuperAdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  // Dynamic Server State
  const [flights, setFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(true);
  const [submittingFlight, setSubmittingFlight] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Filter & Search
  const [flightSearch, setFlightSearch] = useState('');

  // Modals state
  const [flightModalOpen, setFlightModalOpen] = useState(false);
  const [editFlightModalOpen, setEditFlightModalOpen] = useState(false);
  const [viewFlightModalOpen, setViewFlightModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loadingFlightDetails, setLoadingFlightDetails] = useState(false);

  // Form State: Create Flight
  const [flightForm, setFlightForm] = useState({
    flightName: '',
    flightNumber: '',
    originAirportId: '',
    destinationAirportId: '',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '10:00',
    arrivalDate: new Date().toISOString().split('T')[0],
    arrivalTime: '11:15',
    aircraftLayoutId: '',
    adultFare: 3500,
    childFare: 2600,
    baseFare: 3500,
    status: 'ACTIVE'
  });

  // Form State: Edit Flight
  const [editingFlight, setEditingFlight] = useState(null);
  const [editFlightForm, setEditFlightForm] = useState({
    _id: '',
    flightName: '',
    flightNumber: '',
    originAirportId: '',
    destinationAirportId: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    aircraftLayoutId: '',
    adultFare: 3500,
    childFare: 2600,
    baseFare: 3500,
    status: 'ACTIVE'
  });

  // Aircraft Layout State for Designer tab
  const [layoutType, setLayoutType] = useState('3-3');
  const [rowCount, setRowCount] = useState(10);

  // Admin Management State
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    role: 'SCHEDULE_ADMIN'
  });

  // Bookings list state
  const [bookings, setBookings] = useState([
    { id: 'BK-101', ref: 'SKN-882314', customer: 'Alex Doe', flight: 'SK-101', route: 'MAA → BLR', status: 'CONFIRMED', amount: 3500 },
    { id: 'BK-102', ref: 'SKN-912450', customer: 'Sarah Connor', flight: 'SK-204', route: 'DEL → BOM', status: 'CONFIRMED', amount: 5800 },
    { id: 'BK-103', ref: 'SKN-642109', customer: 'Bruce Wayne', flight: 'SK-309', route: 'BLR → DEL', status: 'COMPLETED', amount: 4800 },
    { id: 'BK-104', ref: 'SKN-512993', customer: 'Diana Prince', flight: 'SK-412', route: 'BOM → GOI', status: 'CANCELLED', amount: 2999 }
  ]);

  // Pricing Modal State (Super Admin Exclusive)
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingFlight, setPricingFlight] = useState(null);
  const [pricingForm, setPricingForm] = useState({
    adultFare: 3500,
    childFare: 2625,
    syncFutureInstances: true
  });
  const [savingPricing, setSavingPricing] = useState(false);

  const handleOpenPricingModal = (fl) => {
    setPricingFlight(fl);
    const adultFare = fl.baseFare || 3500;
    const childFare = fl.childFare || Math.round(adultFare * 0.75);
    setPricingForm({
      adultFare,
      childFare,
      syncFutureInstances: true
    });
    setPricingModalOpen(true);
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    if (!pricingFlight) return;

    const adultNum = Number(pricingForm.adultFare);
    const childNum = Number(pricingForm.childFare);

    if (isNaN(adultNum) || adultNum <= 0) {
      toast.error('Adult fare must be a positive number');
      return;
    }

    setSavingPricing(true);
    try {
      const res = await api.put(`/admin/flights/${pricingFlight._id}/pricing`, {
        baseFare: adultNum,
        adultFare: adultNum,
        childFare: childNum,
        syncFutureInstances: pricingForm.syncFutureInstances
      });

      toast.success(res.data?.message || 'Flight airfare pricing updated in MongoDB Atlas!');
      setPricingModalOpen(false);
      await fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update flight pricing');
    } finally {
      setSavingPricing(false);
    }
  };

  // Fetch Master Data & Flights
  const fetchAllData = async () => {
    setLoadingFlights(true);
    try {
      let [flightsRes, airportsRes, layoutsRes] = await Promise.all([
        api.get('/admin/flights').catch(() => null),
        api.get('/airports').catch(() => null),
        api.get('/admin/layouts').catch(() => null)
      ]);

      if (!flightsRes?.data?.data?.flights) {
        flightsRes = await api.get('/flights').catch(() => null);
      }

      if (flightsRes?.data?.data?.flights) {
        setFlights(flightsRes.data.data.flights);
      }

      let loadedAirports = [];
      if (airportsRes?.data?.data?.airports?.length) {
        loadedAirports = airportsRes.data.data.airports;
        setAirports(loadedAirports);
      }

      let loadedLayouts = [];
      if (layoutsRes?.data?.data?.layouts?.length) {
        loadedLayouts = layoutsRes.data.data.layouts;
        setLayouts(loadedLayouts);
      }

      // Default selection initialization
      setFlightForm((prev) => {
        const maa = loadedAirports.find((a) => a.code === 'MAA')?._id || loadedAirports[0]?._id || '';
        const blr = loadedAirports.find((a) => a.code === 'BLR')?._id || loadedAirports[1]?._id || '';
        const lay = loadedLayouts[0]?._id || '';
        return {
          ...prev,
          originAirportId: prev.originAirportId || maa,
          destinationAirportId: prev.destinationAirportId || blr,
          aircraftLayoutId: prev.aircraftLayoutId || lay
        };
      });
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoadingFlights(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
    toast.success('Super Admin logged out successfully');
  };

  // Layout helper to compute capacity dynamically
  const getLayoutDetails = (layoutId) => {
    const list = layouts.length ? layouts : [];
    const found = list.find((l) => (l._id === layoutId || l.id === layoutId));
    if (!found) return { name: 'Standard Aircraft Layout', capacity: 180, type: '3-3' };
    const cap =
      found.totalCapacity ||
      (found.seatDefinitions?.length ? found.seatDefinitions.filter((s) => s.active !== false).length : null) ||
      (found.rows && found.seatsPerRow ? found.rows * found.seatsPerRow : 180);
    return {
      name: found.name,
      capacity: cap,
      type: found.type || '3-3',
      rows: found.rows || 30
    };
  };

  // Airport helpers
  const getAirportCode = (ref) => {
    if (!ref) return '';
    if (typeof ref === 'object' && ref.code) return ref.code;
    const list = airports.length ? airports : FALLBACK_AIRPORTS;
    const match = list.find((a) => a._id === ref || a.code === ref);
    return match?.code || ref;
  };

  const getAirportCity = (ref) => {
    if (!ref) return '';
    if (typeof ref === 'object' && ref.city) return ref.city;
    const list = airports.length ? airports : FALLBACK_AIRPORTS;
    const match = list.find((a) => a._id === ref || a.code === ref);
    return match?.city || '';
  };

  const getAirportName = (ref) => {
    if (!ref) return '';
    if (typeof ref === 'object' && ref.name) return ref.name;
    const list = airports.length ? airports : FALLBACK_AIRPORTS;
    const match = list.find((a) => a._id === ref || a.code === ref);
    return match?.name || '';
  };

  const buildDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  // Validation Engine
  const validateForm = (form, isEdit = false) => {
    const errors = {};

    // 1. Flight Number
    const rawNum = form.flightNumber?.trim() || '';
    if (!rawNum) {
      errors.flightNumber = 'Flight number is required (e.g. SK-501)';
    } else if (!/^[A-Z0-9-]{3,10}$/i.test(rawNum)) {
      errors.flightNumber = 'Flight number must be 3-10 characters (e.g. SK-501)';
    } else {
      const norm = rawNum.toUpperCase();
      const duplicate = flights.find((f) => {
        const fId = f._id || f.id;
        if (isEdit && fId === form._id) return false;
        const curNum = (f.flightNumber || f.flightCode || '').toUpperCase();
        return curNum === norm;
      });
      if (duplicate) {
        errors.flightNumber = `Flight number ${norm} is already registered in the catalog`;
      }
    }

    // 2. Adult and Child Fares
    const adultFareNum = Number(form.adultFare !== undefined ? form.adultFare : form.baseFare);
    if (isNaN(adultFareNum) || adultFareNum <= 0) {
      errors.adultFare = 'Adult ticket price must be a positive number greater than ₹0';
    }
    const childFareNum = Number(form.childFare);
    if (isNaN(childFareNum) || childFareNum < 0) {
      errors.childFare = 'Child ticket price must be a non-negative number';
    }

    // 3. Origin & Destination Airports
    if (!form.originAirportId) {
      errors.originAirportId = 'Origin airport is required';
    }
    if (!form.destinationAirportId) {
      errors.destinationAirportId = 'Destination airport is required';
    }
    if (form.originAirportId && form.destinationAirportId && form.originAirportId === form.destinationAirportId) {
      errors.destinationAirportId = 'Origin and destination airports must be different';
    }

    // 4. Departure & Arrival Dates/Times
    const depDT = buildDateTime(form.departureDate, form.departureTime);
    const arrDT = buildDateTime(form.arrivalDate, form.arrivalTime);

    if (!depDT || isNaN(depDT.getTime())) {
      errors.departureDateTime = 'Valid departure date & time is required';
    }
    if (!arrDT || isNaN(arrDT.getTime())) {
      errors.arrivalDateTime = 'Valid arrival date & time is required';
    }
    if (depDT && arrDT && arrDT <= depDT) {
      errors.arrivalDateTime = 'Departure date & time must precede arrival date & time (overnight flights supported)';
    }

    // 5. Aircraft Layout
    if (!form.aircraftLayoutId) {
      errors.aircraftLayoutId = 'Aircraft seating layout is required';
    }

    return errors;
  };

  // Action: Create New Flight
  const handleCreateFlight = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    const errors = validateForm(flightForm, false);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please resolve the validation errors');
      return;
    }

    setSubmittingFlight(true);
    try {
      const depDT = buildDateTime(flightForm.departureDate, flightForm.departureTime);
      const arrDT = buildDateTime(flightForm.arrivalDate, flightForm.arrivalTime);

      const adultNum = Number(flightForm.adultFare !== undefined ? flightForm.adultFare : flightForm.baseFare);
      const childNum = Number(flightForm.childFare !== undefined && flightForm.childFare !== '' ? flightForm.childFare : Math.round(adultNum * 0.75));

      const payload = {
        flightName: flightForm.flightName?.trim() || undefined,
        flightNumber: flightForm.flightNumber.trim().toUpperCase(),
        originAirportId: flightForm.originAirportId,
        destinationAirportId: flightForm.destinationAirportId,
        baseFare: adultNum,
        adultFare: adultNum,
        childFare: childNum,
        departureDateTime: depDT.toISOString(),
        arrivalDateTime: arrDT.toISOString(),
        aircraftLayoutId: flightForm.aircraftLayoutId,
        status: flightForm.status || 'ACTIVE'
      };

      const res = await api.post('/admin/flights', payload);
      toast.success(`✈️ Flight ${payload.flightNumber} created successfully in MongoDB Atlas!`);
      setFlightModalOpen(false);

      // Reset Form
      setFlightForm({
        flightName: '',
        flightNumber: '',
        originAirportId: airports.find((a) => a.code === 'MAA')?._id || airports[0]?._id || '',
        destinationAirportId: airports.find((a) => a.code === 'BLR')?._id || airports[1]?._id || '',
        departureDate: new Date().toISOString().split('T')[0],
        departureTime: '10:00',
        arrivalDate: new Date().toISOString().split('T')[0],
        arrivalTime: '11:15',
        aircraftLayoutId: layouts[0]?._id || '',
        adultFare: 3500,
        childFare: 2600,
        baseFare: 3500,
        status: 'ACTIVE'
      });

      // Refresh list
      await fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create flight';
      toast.error(msg);
      if (msg.toLowerCase().includes('flight number')) {
        setValidationErrors((prev) => ({ ...prev, flightNumber: msg }));
      } else if (msg.toLowerCase().includes('fare')) {
        setValidationErrors((prev) => ({ ...prev, baseFare: msg }));
      } else if (msg.toLowerCase().includes('airport')) {
        setValidationErrors((prev) => ({ ...prev, destinationAirportId: msg }));
      } else if (msg.toLowerCase().includes('departure') || msg.toLowerCase().includes('arrival')) {
        setValidationErrors((prev) => ({ ...prev, arrivalDateTime: msg }));
      }
    } finally {
      setSubmittingFlight(false);
    }
  };

  // Action: Open View Flight Details Modal
  const handleOpenViewFlight = async (fl) => {
    setSelectedFlight(fl);
    setViewFlightModalOpen(true);
    setLoadingFlightDetails(true);

    try {
      const flightId = fl._id || fl.id;
      const res = await api.get(`/admin/flights/${flightId}`);
      if (res.data?.data?.flight) {
        setSelectedFlight({
          ...res.data.data.flight,
          activeBookingsCount: res.data.data.activeBookingsCount || 0
        });
      }
    } catch (err) {
      console.error('Error fetching flight details:', err);
    } finally {
      setLoadingFlightDetails(false);
    }
  };

  // Action: Open Edit Modal
  const handleOpenEditFlight = (fl) => {
    setEditingFlight(fl);
    setValidationErrors({});

    const depISO = fl.departureDateTime ? new Date(fl.departureDateTime) : null;
    const arrISO = fl.arrivalDateTime ? new Date(fl.arrivalDateTime) : null;

    const adultVal = fl.adultFare || fl.baseFare || 3500;
    const childVal = fl.childFare !== undefined ? fl.childFare : Math.round(adultVal * 0.75);

    setEditFlightForm({
      _id: fl._id || fl.id,
      flightName: fl.flightName || '',
      flightNumber: fl.flightNumber || fl.flightCode || '',
      originAirportId: fl.originAirportId?._id || fl.originAirportId || fl.origin || '',
      destinationAirportId: fl.destinationAirportId?._id || fl.destinationAirportId || fl.destination || '',
      departureDate: depISO ? depISO.toISOString().split('T')[0] : (fl.departureDate || new Date().toISOString().split('T')[0]),
      departureTime: depISO ? depISO.toTimeString().slice(0, 5) : (fl.departureTime || '10:00'),
      arrivalDate: arrISO ? arrISO.toISOString().split('T')[0] : (fl.arrivalDate || new Date().toISOString().split('T')[0]),
      arrivalTime: arrISO ? arrISO.toTimeString().slice(0, 5) : (fl.arrivalTime || '11:15'),
      aircraftLayoutId: fl.aircraftLayoutId?._id || fl.aircraftLayoutId || layouts[0]?._id || '',
      adultFare: adultVal,
      childFare: childVal,
      baseFare: adultVal,
      status: fl.status || (fl.active === false ? 'INACTIVE' : 'ACTIVE')
    });
    setEditFlightModalOpen(true);
  };

  // Action: Save Edit Flight
  const handleSaveEditFlight = async (e) => {
    e.preventDefault();
    if (!editingFlight) return;
    setValidationErrors({});

    const errors = validateForm(editFlightForm, true);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please resolve validation errors');
      return;
    }

    setSubmittingFlight(true);
    try {
      const depDT = buildDateTime(editFlightForm.departureDate, editFlightForm.departureTime);
      const arrDT = buildDateTime(editFlightForm.arrivalDate, editFlightForm.arrivalTime);

      const adultVal = Number(editFlightForm.adultFare !== undefined ? editFlightForm.adultFare : editFlightForm.baseFare);
      const childVal = Number(editFlightForm.childFare !== undefined && editFlightForm.childFare !== '' ? editFlightForm.childFare : Math.round(adultVal * 0.75));

      const payload = {
        flightName: editFlightForm.flightName?.trim() || undefined,
        flightNumber: editFlightForm.flightNumber.trim().toUpperCase(),
        originAirportId: editFlightForm.originAirportId,
        destinationAirportId: editFlightForm.destinationAirportId,
        baseFare: adultVal,
        adultFare: adultVal,
        childFare: childVal,
        departureDateTime: depDT.toISOString(),
        arrivalDateTime: arrDT.toISOString(),
        aircraftLayoutId: editFlightForm.aircraftLayoutId,
        status: editFlightForm.status
      };

      await api.put(`/admin/flights/${editFlightForm._id}`, payload);
      toast.success(`Flight ${payload.flightNumber} updated successfully!`);
      setEditFlightModalOpen(false);
      await fetchAllData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update flight';
      toast.error(msg);
    } finally {
      setSubmittingFlight(false);
    }
  };

  // Action: Toggle Flight Status (Active <-> Inactive)
  const handleToggleFlightStatus = async (fl) => {
    const flightId = fl._id || fl.id;
    const curStatus = fl.status || (fl.active === false ? 'INACTIVE' : 'ACTIVE');
    const targetStatus = curStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await api.patch(`/admin/flights/${flightId}/status`, { status: targetStatus });
      toast.success(`Flight ${fl.flightNumber || fl.flightCode} marked as ${targetStatus}. Existing bookings are preserved.`);
      await fetchAllData();
    } catch (err) {
      // Local fallback
      setFlights(flights.map((f) => (f._id === flightId || f.id === flightId ? { ...f, status: targetStatus, active: targetStatus === 'ACTIVE' } : f)));
      toast.success(`Flight marked as ${targetStatus} (Bookings preserved)`);
    }
  };

  // Action: Deactivate / Delete Flight
  const handleDeleteFlight = async (fl) => {
    const flightId = fl._id || fl.id;
    const fNum = fl.flightNumber || fl.flightCode;
    if (!window.confirm(`Are you sure you want to archive flight ${fNum}? Confirmed customer bookings will not be invalidated.`)) {
      return;
    }

    try {
      await api.delete(`/admin/flights/${flightId}`);
      toast.success(`Flight ${fNum} deactivated from catalog. Bookings preserved.`);
      await fetchAllData();
    } catch (err) {
      setFlights(flights.filter((f) => f._id !== flightId && f.id !== flightId));
      toast.success(`Flight ${fNum} removed`);
    }
  };

  const handleCreateAdmin = (e) => {
    e.preventDefault();
    const newAdm = {
      id: `ADM-${admins.length + 1}`,
      name: adminForm.name,
      email: adminForm.email,
      role: adminForm.role,
      status: 'ACTIVE'
    };
    setAdmins([...admins, newAdm]);
    setAdminModalOpen(false);
    toast.success(`Admin user ${newAdm.email} registered!`);
  };

  // Filtered flights
  const filteredFlights = flights.filter((f) => {
    const q = flightSearch.toLowerCase();
    const fNum = (f.flightNumber || f.flightCode || '').toLowerCase();
    const fName = (f.flightName || '').toLowerCase();
    const origCode = getAirportCode(f.originAirportId || f.origin).toLowerCase();
    const destCode = getAirportCode(f.destinationAirportId || f.destination).toLowerCase();
    const origCity = getAirportCity(f.originAirportId || f.origin).toLowerCase();
    const destCity = getAirportCity(f.destinationAirportId || f.destination).toLowerCase();
    return (
      fNum.includes(q) ||
      fName.includes(q) ||
      origCode.includes(q) ||
      destCode.includes(q) ||
      origCity.includes(q) ||
      destCity.includes(q)
    );
  });

  const tabs = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ANALYTICS', label: 'Revenue & Customer Analytics', icon: BarChart2 },
    { id: 'FLIGHTS', label: 'Flights', icon: Plane },
    { id: 'LAYOUTS', label: 'Aircraft Layouts', icon: Layers },
    { id: 'BOOKINGS', label: 'Bookings', icon: Ticket },
    { id: 'ADMINS', label: 'Staff & Admins', icon: Shield },
    { id: 'LOGS', label: 'Audit Logs', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-navy text-white p-6 space-y-6 shrink-0">
        <div className="flex items-center gap-2.5 pb-6 border-b border-navy-800">
          <div className="w-9 h-9 rounded-xl bg-skyblue flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">Super Admin</h2>
            <span className="text-[10px] text-skyblue font-mono font-bold uppercase">Control Hub</span>
          </div>
        </div>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  isActive
                    ? 'bg-skyblue text-white shadow-md'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Logout Button */}
        <div className="pt-6 border-t border-navy-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Hub</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        {/* Top Header Session Bar with Quick Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-8 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-navy uppercase tracking-wider">Super Administrator Console</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Full Access Mode</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono">
              {user?.email || 'superadmin@skynexa.com'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition border border-rose-200 cursor-pointer shadow-2xs"
              title="Sign Out of Super Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* TAB: DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-navy">Super Admin Overview</h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time operational metrics across all flight systems, bookings, and fleet resources.
              </p>
            </div>

            {/* 8 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCard title="Total Users" value="12,480" change="+14%" isPositive subtitle="vs last month" icon={Users} />
              <StatsCard title="Active Flights" value="48" change="+3" isPositive subtitle="daily routes" icon={Plane} />
              <StatsCard title="Today's Departures" value="18" change="100%" isPositive subtitle="on schedule" icon={Calendar} />
              <StatsCard title="Confirmed Bookings" value="1,842" change="+22%" isPositive subtitle="this week" icon={Ticket} />
              <StatsCard title="Cancelled Bookings" value="24" change="-8%" isPositive subtitle="within tolerance" icon={AlertTriangle} />
              <StatsCard title="Total Revenue" value="$482,900" change="+18%" isPositive subtitle="current quarter" icon={BarChart2} />
              <StatsCard title="Active Offers" value="4" change="Live" isPositive subtitle="promo codes" icon={Tag} />
              <StatsCard title="Open Tickets" value="3" change="Low" isPositive subtitle="avg response 12m" icon={HelpCircle} />
            </div>

            {/* Revenue Analytics Shortcut Banner */}
            <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-sm border border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-bold text-skyblue tracking-wider uppercase">Live Revenue & Manifest Intelligence</span>
                </div>
                <h3 className="text-lg font-black text-white">Super Admin Financial Reconciliation Hub</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Inspect flight-wise collected revenue, net returns, seat load factors, and customer booking manifests with DGCA-compliant Aadhaar and payment privacy masking.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className="px-5 py-2.5 bg-skyblue hover:bg-sky-400 text-white text-xs font-extrabold rounded-xl transition shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <BarChart2 className="w-4 h-4" /> Open Revenue & Customer Analytics →
              </button>
            </div>

            {/* Recent Bookings Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-navy">Recent Customer Reservations</h3>
                <button
                  onClick={() => setActiveTab('BOOKINGS')}
                  className="text-xs font-bold text-skyblue hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Route</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-mono font-bold text-navy">{b.ref}</td>
                        <td className="py-3">{b.customer}</td>
                        <td className="py-3">{b.route}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-navy">${b.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REVENUE & CUSTOMER ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <RevenueAnalyticsTab />
        )}

        {/* TAB: FLIGHTS */}
        {activeTab === 'FLIGHTS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-navy">Flight Catalog Management</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Add, update, or archive scheduled flights and assigned aircraft.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAllData}
                  disabled={loadingFlights}
                  className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Refresh Flight Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFlights ? 'animate-spin text-skyblue' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => {
                    setValidationErrors({});
                    setFlightModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Flight
                </button>
              </div>
            </div>

            {/* Filter and Summary bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={flightSearch}
                  onChange={(e) => setFlightSearch(e.target.value)}
                  placeholder="Search by flight number (e.g. SK-501), name, or airport (MAA, BLR, Mumbai)..."
                  className="w-full text-xs font-medium focus:outline-none"
                />
                {flightSearch && (
                  <button onClick={() => setFlightSearch('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                    Clear
                  </button>
                )}
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center justify-between sm:justify-start gap-3 shadow-xs text-xs font-bold text-slate-600">
                <span>Total Catalog:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-skyblue font-mono text-xs">
                  {filteredFlights.length} Flights
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="p-4">Flight</th>
                      <th className="p-4">Route</th>
                      <th className="p-4">Departure / Arrival</th>
                      <th className="p-4">Aircraft Layout & Capacity</th>
                      <th className="p-4">Base Fare</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {loadingFlights ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-skyblue mb-2" />
                          <p className="font-semibold text-xs">Connecting to MongoDB Atlas...</p>
                        </td>
                      </tr>
                    ) : filteredFlights.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-slate-400">
                          <Plane className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-600 text-xs">No flights found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {flightSearch ? 'Try adjusting your search criteria' : 'Click "Add New Flight" to schedule your first flight route'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredFlights.map((fl) => {
                        const flightId = fl._id || fl.id;
                        const origCode = getAirportCode(fl.originAirportId || fl.origin);
                        const destCode = getAirportCode(fl.destinationAirportId || fl.destination);
                        const origCity = getAirportCity(fl.originAirportId || fl.origin);
                        const destCity = getAirportCity(fl.destinationAirportId || fl.destination);
                        const layoutInfo = getLayoutDetails(fl.aircraftLayoutId?._id || fl.aircraftLayoutId);
                        const capacity = fl.totalCapacity || fl.capacity || layoutInfo.capacity;
                        const isOvernight = fl.departureDateTime && fl.arrivalDateTime &&
                          new Date(fl.departureDateTime).toDateString() !== new Date(fl.arrivalDateTime).toDateString();

                        const depTimeStr = fl.departureDateTime
                          ? new Date(fl.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : (fl.departureTime || '10:00 AM');
                        const arrTimeStr = fl.arrivalDateTime
                          ? new Date(fl.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : (fl.arrivalTime || '11:15 AM');

                        const depDateStr = fl.departureDateTime
                          ? new Date(fl.departureDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : (fl.departureDate || 'Scheduled');

                        const flightStatus = fl.status || (fl.active === false ? 'INACTIVE' : 'ACTIVE');

                        return (
                          <tr key={flightId} className="hover:bg-slate-50/60 transition">
                            <td className="p-4">
                              <div className="font-bold text-navy text-sm">
                                {fl.flightName || 'Skynexa Flight'}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {fl.flightNumber || fl.flightCode}
                                </span>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-navy flex items-center gap-1 text-xs">
                                <span>{origCode}</span>
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <span>{destCode}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                                {origCity} → {destCity}
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-slate-800 text-xs">
                                {depTimeStr} – {arrTimeStr}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{depDateStr}</span>
                                {isOvernight && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                    +1 Day
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-slate-800 truncate max-w-[190px]">
                                {fl.aircraftLayoutId?.name || layoutInfo.name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                  {capacity} Seats
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {layoutInfo.type} cabin
                                </span>
                              </div>
                            </td>

                            <td className="p-4">
                              <div className="font-bold text-navy text-sm font-mono">
                                ₹{(fl.adultFare || fl.baseFare || 3500).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                <span className="text-slate-600 font-semibold">Adult: ₹{(fl.adultFare || fl.baseFare || 3500).toLocaleString('en-IN')}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">Child: ₹{(fl.childFare !== undefined ? fl.childFare : Math.round((fl.adultFare || fl.baseFare || 3500) * 0.75)).toLocaleString('en-IN')}</span>
                              </div>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  flightStatus === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : flightStatus === 'MAINTENANCE'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    flightStatus === 'ACTIVE'
                                      ? 'bg-emerald-500'
                                      : flightStatus === 'MAINTENANCE'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                {flightStatus}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View Flight Details */}
                                <button
                                  onClick={() => handleOpenViewFlight(fl)}
                                  className="p-1.5 text-slate-600 hover:text-navy hover:bg-slate-100 rounded-lg transition border border-slate-200 cursor-pointer"
                                  title="View Full Flight Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Flight */}
                                <button
                                  onClick={() => handleOpenEditFlight(fl)}
                                  className="px-2.5 py-1.5 text-skyblue hover:bg-sky-50 rounded-lg transition font-bold text-xs flex items-center gap-1 border border-sky-100 cursor-pointer"
                                  title="Edit Flight Schedule & Aircraft"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="hidden md:inline">Edit</span>
                                </button>

                                {/* Configure Fares (Super Admin Exclusive) */}
                                <button
                                  onClick={() => handleOpenPricingModal(fl)}
                                  className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition font-bold text-xs flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                  title="Configure Adult & Child Airfares"
                                >
                                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="hidden md:inline">Fares</span>
                                </button>

                                {/* Deactivate / Activate Toggle */}
                                <button
                                  onClick={() => handleToggleFlightStatus(fl)}
                                  className={`p-1.5 rounded-lg transition border cursor-pointer ${
                                    flightStatus === 'ACTIVE'
                                      ? 'text-amber-600 hover:bg-amber-50 border-amber-100'
                                      : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'
                                  }`}
                                  title={
                                    flightStatus === 'ACTIVE'
                                      ? 'Deactivate Flight (Customer Bookings Preserved)'
                                      : 'Activate Flight'
                                  }
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete / Archive Flight */}
                                <button
                                  onClick={() => handleDeleteFlight(fl)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition border border-rose-100 cursor-pointer"
                                  title="Archive Flight"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AIRCRAFT LAYOUTS */}
        {activeTab === 'LAYOUTS' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-navy">Visual Aircraft Layout Designer</h1>
              <p className="text-xs text-slate-500 mt-1">
                Configure seat pitch, row densities, and visual cabin arrangements.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-navy">Cabin Parameters</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Layout Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['3-3', '2-2'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLayoutType(type)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          layoutType === type
                            ? 'bg-navy text-white border-navy'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {type} Layout
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Rows ({rowCount} rows)
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    value={rowCount}
                    onChange={(e) => setRowCount(Number(e.target.value))}
                    className="w-full accent-skyblue"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Total Seats:</strong> {rowCount * (layoutType === '3-3' ? 6 : 4)}
                  </p>
                  <p>
                    <strong>Aisle Configuration:</strong> Single central aisle
                  </p>
                </div>

                <button
                  onClick={() => toast.success('Layout configuration saved to fleet master!')}
                  className="w-full py-3 bg-skyblue hover:bg-navy text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Save Layout Template
                </button>
              </div>

              {/* Visual Seat Map Preview */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <h3 className="text-sm font-extrabold text-navy text-center mb-4">
                  Live Layout Preview ({layoutType} • {rowCount} Rows)
                </h3>
                <SeatMapComponent
                  layoutType={layoutType}
                  rowCount={rowCount}
                  maxSelectable={0}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: BOOKINGS */}
        {activeTab === 'BOOKINGS' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-navy">All Passenger Bookings</h1>
              <p className="text-xs text-slate-500 mt-1">
                Centralized registry of all confirmed and pending flight reservations.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-4">Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Flight</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Fare Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-navy">{b.ref}</td>
                      <td className="p-4">{b.customer}</td>
                      <td className="p-4 font-bold">{b.flight}</td>
                      <td className="p-4">{b.route}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-navy">${b.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: ADMINS */}
        {activeTab === 'ADMINS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-navy">Admin User Permissions</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Manage Schedule Admins and Marketing Admins across operational departments.
                </p>
              </div>

              <button
                onClick={() => setAdminModalOpen(true)}
                className="px-4 py-2.5 bg-navy hover:bg-skyblue text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Admin
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {admins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-navy">{adm.name}</td>
                      <td className="p-4">{adm.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-navy text-skyblue">
                          {adm.role}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-600 font-bold">{adm.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-navy">System Audit Trail</h1>
              <p className="text-xs text-slate-500 mt-1">
                Immutable record of administrative actions, schedule modifications, and security events.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Executed By</th>
                    <th className="p-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {INITIAL_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-navy">{log.action}</td>
                      <td className="p-4">{log.details}</td>
                      <td className="p-4 font-mono text-slate-500">{log.user}</td>
                      <td className="p-4 text-right text-slate-400">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== MODAL: CREATE FLIGHT ==================== */}
        <Modal
          isOpen={flightModalOpen}
          onClose={() => {
            if (!submittingFlight) {
              setValidationErrors({});
              setFlightModalOpen(false);
            }
          }}
          title="✈️ Create New Flight"
        >
          <form onSubmit={handleCreateFlight} className="space-y-4 text-xs">
            {/* Top Validation Error Banner */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-0.5">
                  <p className="font-bold">Please correct the following errors:</p>
                  <ul className="list-disc list-inside text-[11px] text-rose-600 space-y-0.5">
                    {Object.values(validationErrors).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Flight Name — placed above Flight Number per spec */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Flight Name <span className="text-slate-400 font-normal">(e.g. Skynexa Express)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Skynexa Express / Indigo Connect"
                value={flightForm.flightName}
                onChange={(e) => setFlightForm({ ...flightForm, flightName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs bg-slate-50/30 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">Human-readable marketing name for customer ticket displays</p>
            </div>

            {/* Flight Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Flight Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="SK-501"
                value={flightForm.flightNumber}
                onChange={(e) => {
                  setFlightForm({ ...flightForm, flightNumber: e.target.value.toUpperCase() });
                  if (validationErrors.flightNumber) {
                    setValidationErrors((prev) => ({ ...prev, flightNumber: undefined }));
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold uppercase text-xs transition ${
                  validationErrors.flightNumber
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                }`}
              />
              {validationErrors.flightNumber && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold">{validationErrors.flightNumber}</p>
              )}
            </div>

            {/* Dynamic Adult and Child Ticket Pricing Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-sky-50/40 rounded-2xl border border-sky-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adult Ticket Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={flightForm.adultFare}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFlightForm({ ...flightForm, adultFare: val, baseFare: val });
                      if (validationErrors.adultFare || validationErrors.baseFare) {
                        setValidationErrors((prev) => ({ ...prev, adultFare: undefined, baseFare: undefined }));
                      }
                    }}
                    className={`w-full pl-7 pr-3.5 py-2.5 rounded-xl border font-mono font-bold text-xs transition ${
                      validationErrors.adultFare || validationErrors.baseFare
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                        : 'border-slate-200 focus:border-skyblue bg-white'
                    }`}
                  />
                </div>
                {(validationErrors.adultFare || validationErrors.baseFare) && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">{validationErrors.adultFare || validationErrors.baseFare}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Adult passenger fare (12+ yrs)</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Child Ticket Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="3000"
                    value={flightForm.childFare}
                    onChange={(e) => {
                      setFlightForm({ ...flightForm, childFare: Number(e.target.value) });
                      if (validationErrors.childFare) {
                        setValidationErrors((prev) => ({ ...prev, childFare: undefined }));
                      }
                    }}
                    className={`w-full pl-7 pr-3.5 py-2.5 rounded-xl border font-mono font-bold text-xs transition ${
                      validationErrors.childFare
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                        : 'border-slate-200 focus:border-skyblue bg-white'
                    }`}
                  />
                </div>
                {validationErrors.childFare && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">{validationErrors.childFare}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Child passenger fare (2–11 yrs)</p>
              </div>
            </div>

            {/* Origin & Destination Airports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Origin Airport <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={flightForm.originAirportId}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, originAirportId: e.target.value });
                    if (validationErrors.originAirportId || validationErrors.destinationAirportId) {
                      setValidationErrors((prev) => ({ ...prev, originAirportId: undefined, destinationAirportId: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs transition ${
                    validationErrors.originAirportId
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                  }`}
                >
                  <option value="" disabled>Select Origin Airport</option>
                  {(airports.length ? airports : FALLBACK_AIRPORTS).map((a) => (
                    <option key={a._id || a.code} value={a._id || a.code}>
                      {a.code} – {a.city} ({a.name})
                    </option>
                  ))}
                </select>
                {validationErrors.originAirportId && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">{validationErrors.originAirportId}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Destination Airport <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={flightForm.destinationAirportId}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, destinationAirportId: e.target.value });
                    if (validationErrors.destinationAirportId) {
                      setValidationErrors((prev) => ({ ...prev, destinationAirportId: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs transition ${
                    validationErrors.destinationAirportId
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                  }`}
                >
                  <option value="" disabled>Select Destination Airport</option>
                  {(airports.length ? airports : FALLBACK_AIRPORTS).map((a) => (
                    <option key={a._id || a.code} value={a._id || a.code}>
                      {a.code} – {a.city} ({a.name})
                    </option>
                  ))}
                </select>
                {validationErrors.destinationAirportId && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">{validationErrors.destinationAirportId}</p>
                )}
              </div>
            </div>

            {/* Departure Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Departure Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={flightForm.departureDate}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, departureDate: e.target.value });
                    if (validationErrors.arrivalDateTime) {
                      setValidationErrors((prev) => ({ ...prev, arrivalDateTime: undefined }));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs bg-slate-50/30 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Departure Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={flightForm.departureTime}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, departureTime: e.target.value });
                    if (validationErrors.arrivalDateTime) {
                      setValidationErrors((prev) => ({ ...prev, arrivalDateTime: undefined }));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs bg-slate-50/30 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Arrival Date & Time (Overnight Supported) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Arrival Date <span className="text-rose-500">*</span>
                  </label>
                  {flightForm.departureDate && flightForm.arrivalDate && flightForm.departureDate !== flightForm.arrivalDate && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                      🌙 Overnight Flight
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  min={flightForm.departureDate}
                  value={flightForm.arrivalDate}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, arrivalDate: e.target.value });
                    if (validationErrors.arrivalDateTime) {
                      setValidationErrors((prev) => ({ ...prev, arrivalDateTime: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs transition ${
                    validationErrors.arrivalDateTime
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Arrival Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={flightForm.arrivalTime}
                  onChange={(e) => {
                    setFlightForm({ ...flightForm, arrivalTime: e.target.value });
                    if (validationErrors.arrivalDateTime) {
                      setValidationErrors((prev) => ({ ...prev, arrivalDateTime: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs transition ${
                    validationErrors.arrivalDateTime
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                  }`}
                />
              </div>
            </div>
            {validationErrors.arrivalDateTime && (
              <p className="text-[10px] text-rose-600 font-semibold">{validationErrors.arrivalDateTime}</p>
            )}

            {/* Aircraft Layout & Auto-Capacity Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Aircraft Layout <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFlightModalOpen(false);
                    setActiveTab('LAYOUTS');
                  }}
                  className="text-[11px] font-bold text-skyblue hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3" /> Layout Designer
                </button>
              </div>

              <select
                required
                value={flightForm.aircraftLayoutId}
                onChange={(e) => {
                  setFlightForm({ ...flightForm, aircraftLayoutId: e.target.value });
                  if (validationErrors.aircraftLayoutId) {
                    setValidationErrors((prev) => ({ ...prev, aircraftLayoutId: undefined }));
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs transition ${
                  validationErrors.aircraftLayoutId
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : 'border-slate-200 focus:border-skyblue bg-slate-50/30 focus:bg-white'
                }`}
              >
                <option value="" disabled>Select Seating Configuration</option>
                {(layouts.length ? layouts : [
                  { _id: 'default-1', name: 'Airbus A320neo (3-3 Standard)', totalCapacity: 180, type: '3-3' },
                  { _id: 'default-2', name: 'Airbus A321XLR (3-3 Dense)', totalCapacity: 222, type: '3-3' },
                  { _id: 'default-3', name: 'Embraer E190 Regional (2-2 Jet)', totalCapacity: 80, type: '2-2' },
                  { _id: 'default-4', name: 'ATR 72-600 (2-2 Turboprop)', totalCapacity: 72, type: '2-2' }
                ]).map((lay) => {
                  const cap =
                    lay.totalCapacity ||
                    (lay.seatDefinitions?.length ? lay.seatDefinitions.filter((s) => s.active !== false).length : null) ||
                    (lay.rows && lay.seatsPerRow ? lay.rows * lay.seatsPerRow : 180);
                  return (
                    <option key={lay._id} value={lay._id}>
                      {lay.name} ({cap} seats • {lay.type || '3-3'})
                    </option>
                  );
                })}
              </select>

              {/* Dynamic Auto-Capacity Badge */}
              {flightForm.aircraftLayoutId && (
                <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-800">
                      Total Capacity: {getLayoutDetails(flightForm.aircraftLayoutId).capacity} Seats Available
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Auto-calculated from aircraft layout
                  </span>
                </div>
              )}
            </div>

            {/* Flight Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Initial Flight Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFlightForm({ ...flightForm, status: 'ACTIVE' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    flightForm.status === 'ACTIVE'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Active in Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setFlightForm({ ...flightForm, status: 'INACTIVE' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    flightForm.status === 'INACTIVE'
                      ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" /> Inactive / Paused
                </button>
              </div>
            </div>

            {/* Buttons: Cancel | Create Flight */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingFlight}
                onClick={() => {
                  setValidationErrors({});
                  setFlightModalOpen(false);
                }}
                className="px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingFlight}
                className="px-5 py-2.5 font-bold text-white bg-navy hover:bg-skyblue rounded-xl shadow-xs cursor-pointer transition text-xs flex items-center gap-2 disabled:opacity-60"
              >
                {submittingFlight ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Validating & Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Flight</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODAL: EDIT FLIGHT ==================== */}
        <Modal
          isOpen={editFlightModalOpen}
          onClose={() => {
            if (!submittingFlight) {
              setValidationErrors({});
              setEditFlightModalOpen(false);
            }
          }}
          title={`✏️ Edit Flight — ${editFlightForm.flightName || editFlightForm.flightNumber || 'Schedule'}`}
        >
          <form onSubmit={handleSaveEditFlight} className="space-y-4 text-xs">
            {/* Top Validation Error Banner */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-0.5">
                  <p className="font-bold">Please correct the following errors:</p>
                  <ul className="list-disc list-inside text-[11px] text-rose-600">
                    {Object.values(validationErrors).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Flight Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flight Name</label>
              <input
                type="text"
                placeholder="e.g. Skynexa Express"
                value={editFlightForm.flightName}
                onChange={(e) => setEditFlightForm({ ...editFlightForm, flightName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
              />
            </div>

            {/* Flight Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Flight Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editFlightForm.flightNumber}
                onChange={(e) => setEditFlightForm({ ...editFlightForm, flightNumber: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono font-bold uppercase text-xs"
              />
            </div>

            {/* Dynamic Adult and Child Ticket Pricing Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-sky-50/40 rounded-2xl border border-sky-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adult Ticket Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={editFlightForm.adultFare}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditFlightForm({ ...editFlightForm, adultFare: val, baseFare: val });
                    }}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono font-bold text-xs bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Adult passenger fare (12+ yrs)</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Child Ticket Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="3000"
                    value={editFlightForm.childFare}
                    onChange={(e) => setEditFlightForm({ ...editFlightForm, childFare: Number(e.target.value) })}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono font-bold text-xs bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Child passenger fare (2–11 yrs)</p>
              </div>
            </div>

            {/* Origin & Destination Airports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Origin Airport <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editFlightForm.originAirportId}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, originAirportId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                >
                  {(airports.length ? airports : FALLBACK_AIRPORTS).map((a) => (
                    <option key={a._id || a.code} value={a._id || a.code}>
                      {a.code} – {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Destination Airport <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editFlightForm.destinationAirportId}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, destinationAirportId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                >
                  {(airports.length ? airports : FALLBACK_AIRPORTS).map((a) => (
                    <option key={a._id || a.code} value={a._id || a.code}>
                      {a.code} – {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  required
                  value={editFlightForm.departureDate}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, departureDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Departure Time</label>
                <input
                  type="time"
                  required
                  value={editFlightForm.departureTime}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, departureTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                />
              </div>
            </div>

            {/* Arrival Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Arrival Date</label>
                <input
                  type="date"
                  required
                  min={editFlightForm.departureDate}
                  value={editFlightForm.arrivalDate}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, arrivalDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  required
                  value={editFlightForm.arrivalTime}
                  onChange={(e) => setEditFlightForm({ ...editFlightForm, arrivalTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
                />
              </div>
            </div>

            {/* Aircraft Layout */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Aircraft Layout</label>
              <select
                required
                value={editFlightForm.aircraftLayoutId}
                onChange={(e) => setEditFlightForm({ ...editFlightForm, aircraftLayoutId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium text-xs"
              >
                {(layouts.length ? layouts : [
                  { _id: 'default-1', name: 'Airbus A320neo (3-3 Standard)', totalCapacity: 180, type: '3-3' },
                  { _id: 'default-2', name: 'Airbus A321XLR (3-3 Dense)', totalCapacity: 222, type: '3-3' },
                  { _id: 'default-3', name: 'Embraer E190 Regional (2-2 Jet)', totalCapacity: 80, type: '2-2' },
                  { _id: 'default-4', name: 'ATR 72-600 (2-2 Turboprop)', totalCapacity: 72, type: '2-2' }
                ]).map((lay) => {
                  const cap =
                    lay.totalCapacity ||
                    (lay.seatDefinitions?.length ? lay.seatDefinitions.filter((s) => s.active !== false).length : null) ||
                    (lay.rows && lay.seatsPerRow ? lay.rows * lay.seatsPerRow : 180);
                  return (
                    <option key={lay._id} value={lay._id}>
                      {lay.name} ({cap} seats • {lay.type || '3-3'})
                    </option>
                  );
                })}
              </select>
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] font-semibold">
                Updated capacity: {getLayoutDetails(editFlightForm.aircraftLayoutId).capacity} Seats (auto-calculated from layout)
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Flight Status</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEditFlightForm({ ...editFlightForm, status: 'ACTIVE' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    editFlightForm.status === 'ACTIVE'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" /> Active
                </button>
                <button
                  type="button"
                  onClick={() => setEditFlightForm({ ...editFlightForm, status: 'INACTIVE' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    editFlightForm.status === 'INACTIVE'
                      ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" /> Inactive
                </button>
              </div>
            </div>

            {/* Safe Booking Note */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Booking Protection Active:</strong> Modifying schedule or fare parameters preserves all confirmed customer ticket reservations without invalidating bookings.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={submittingFlight}
                onClick={() => setEditFlightModalOpen(false)}
                className="px-4 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingFlight}
                className="px-5 py-2.5 font-bold text-white bg-skyblue hover:bg-navy rounded-xl shadow-xs cursor-pointer transition text-xs flex items-center gap-2 disabled:opacity-60"
              >
                {submittingFlight ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Flight Changes</span>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* ==================== MODAL: VIEW FLIGHT DETAILS ==================== */}
        <Modal
          isOpen={viewFlightModalOpen}
          onClose={() => setViewFlightModalOpen(false)}
          title={`✈️ Flight Specifications — ${selectedFlight?.flightNumber || selectedFlight?.flightCode || 'Details'}`}
        >
          {loadingFlightDetails && !selectedFlight ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-skyblue mb-2" />
              <p className="text-xs font-semibold">Retrieving flight details...</p>
            </div>
          ) : selectedFlight && (
            <div className="space-y-4 text-xs">
              {/* Header Card */}
              <div className="bg-navy p-4 rounded-2xl text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">{selectedFlight.flightName || 'Skynexa Scheduled Flight'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-white/20 text-white">
                      {selectedFlight.flightNumber || selectedFlight.flightCode}
                    </span>
                    <span className="text-slate-300 text-xs">Skynexa Core Fleet</span>
                  </div>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (selectedFlight.status || 'ACTIVE') === 'ACTIVE'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {selectedFlight.status || (selectedFlight.active === false ? 'INACTIVE' : 'ACTIVE')}
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Corridor Route</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Departure</span>
                    <div className="text-base font-extrabold text-navy font-mono">
                      {getAirportCode(selectedFlight.originAirportId || selectedFlight.origin)}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {getAirportCity(selectedFlight.originAirportId || selectedFlight.origin)}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {getAirportName(selectedFlight.originAirportId || selectedFlight.origin)}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Arrival Destination</span>
                    <div className="text-base font-extrabold text-navy font-mono">
                      {getAirportCode(selectedFlight.destinationAirportId || selectedFlight.destination)}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {getAirportCity(selectedFlight.destinationAirportId || selectedFlight.destination)}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {getAirportName(selectedFlight.destinationAirportId || selectedFlight.destination)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timings & Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Departure Time</div>
                  <div className="text-xs font-bold text-navy mt-1">
                    {selectedFlight.departureDateTime
                      ? new Date(selectedFlight.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : selectedFlight.departureTime || '10:00 AM'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedFlight.departureDateTime
                      ? new Date(selectedFlight.departureDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                      : selectedFlight.departureDate || 'Daily'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Arrival Time</div>
                  <div className="text-xs font-bold text-navy mt-1">
                    {selectedFlight.arrivalDateTime
                      ? new Date(selectedFlight.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : selectedFlight.arrivalTime || '11:15 AM'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedFlight.arrivalDateTime
                      ? new Date(selectedFlight.arrivalDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                      : selectedFlight.arrivalDate || 'Daily'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Aircraft Layout</div>
                  <div className="text-xs font-bold text-navy mt-1 truncate">
                    {selectedFlight.aircraftLayoutId?.name || getLayoutDetails(selectedFlight.aircraftLayoutId).name}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {selectedFlight.totalCapacity || selectedFlight.capacity || getLayoutDetails(selectedFlight.aircraftLayoutId).capacity} Total Seats
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Base Airfare</div>
                  <div className="text-sm font-extrabold text-navy mt-0.5 font-mono">
                    ₹{(selectedFlight.baseFare || 3500).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Per Passenger</div>
                </div>
              </div>

              {/* Booking Protection & Audit Card */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-navy text-xs">
                      {selectedFlight.activeBookingsCount || 0} Active Confirmed Bookings
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      Protected reservations safely linked in database
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <div>Created by: {selectedFlight.createdBy?.firstName || 'Admin'}</div>
                  <div>ID: {selectedFlight._id || selectedFlight.id}</div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setViewFlightModalOpen(false);
                    handleOpenEditFlight(selectedFlight);
                  }}
                  className="px-4 py-2 font-bold text-white bg-skyblue hover:bg-navy rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit This Flight
                </button>

                <button
                  type="button"
                  onClick={() => setViewFlightModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Create Admin */}
        <Modal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          title="Create New Admin Account"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                placeholder="Staff Member"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                placeholder="staff@skynexa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Role Assignment</label>
              <select
                value={adminForm.role}
                onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-medium"
              >
                <option value="SCHEDULE_ADMIN">Schedule Admin (Flight Operations)</option>
                <option value="MARKETING_ADMIN">Marketing Admin (Promotions & Analytics)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-navy hover:bg-skyblue rounded-xl shadow-xs"
              >
                Register Admin
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Super Admin Flight Fare Management */}
        <Modal
          isOpen={pricingModalOpen}
          onClose={() => setPricingModalOpen(false)}
          title="Configure Flight Airfares (Super Admin Exclusive)"
        >
          {pricingFlight && (
            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-navy text-sm">
                    {pricingFlight.flightNumber || pricingFlight.flightCode}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    SUPER ADMIN PRICING
                  </span>
                </div>
                <div className="text-slate-500 flex items-center justify-between text-[11px]">
                  <span>Route: {pricingFlight.originAirportId?.code || 'DEL'} ➔ {pricingFlight.destinationAirportId?.code || 'BOM'}</span>
                  <span>Current Base: ₹{(pricingFlight.baseFare || 3500).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Adult Base Airfare (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pricingForm.adultFare}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPricingForm((prev) => ({
                        ...prev,
                        adultFare: val,
                        childFare: Math.round(Number(val) * 0.75)
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono font-bold text-navy"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard adult passenger fare</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Child Airfare (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pricingForm.childFare}
                    onChange={(e) => setPricingForm({ ...pricingForm, childFare: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-skyblue font-mono font-bold text-navy"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Default 75% of adult fare</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pricingForm.syncFutureInstances}
                  onChange={(e) => setPricingForm({ ...pricingForm, syncFutureInstances: e.target.checked })}
                  className="rounded text-skyblue focus:ring-skyblue h-4 w-4 mt-0.5"
                />
                <div className="text-[11px]">
                  <span className="font-bold text-navy block">Propagate to Future Departures</span>
                  <span className="text-slate-500">
                    Automatically synchronize this fare to all future scheduled flight departures with 0 bookings. Confirmed passenger reservations retain their immutable fare snapshot.
                  </span>
                </div>
              </label>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Modifications are permanently logged in the <strong>AuditLog</strong> collection in MongoDB Atlas.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPricingModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="px-5 py-2 font-bold text-white bg-navy hover:bg-skyblue rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {savingPricing ? 'Updating in MongoDB...' : 'Save Fares to Database'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
