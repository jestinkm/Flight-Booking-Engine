import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Plane, Calendar, Clock, Armchair, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import api from '../lib/axios';
import SeatMapComponent from '../components/SeatMapComponent';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const FlightDetails = () => {
  const { instanceId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialAdults = parseInt(searchParams.get('adults') || '1', 10);
  const initialChildren = parseInt(searchParams.get('children') || '0', 10);

  const [adults, setAdults] = useState(Math.max(1, initialAdults));
  const [children, setChildren] = useState(Math.max(0, initialChildren));
  const totalPassengers = adults + children;

  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Adjust selected seats if passenger count is decreased
  useEffect(() => {
    if (selectedSeats.length > totalPassengers) {
      setSelectedSeats((prev) => prev.slice(0, totalPassengers));
    }
  }, [totalPassengers, selectedSeats.length]);

  useEffect(() => {
    const fetchFlightInstance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/flights/${instanceId}`);
        const data =
          res.data?.flightInstance ||
          res.data?.data?.flightInstance ||
          (res.data?.data && !Array.isArray(res.data.data) ? res.data.data : null) ||
          res.data;

        // If seats weren't populated, fetch live seat map
        if (data && (!data.seats || data.seats.length === 0)) {
          try {
            const seatRes = await api.get(`/flights/instance/${instanceId}/seats`);
            const seatData = seatRes.data?.data?.seats || seatRes.data?.seats;
            if (seatData && seatData.length > 0) {
              data.seats = seatData;
            }
          } catch {
            // fallback
          }
        }

        setFlightData(data);
      } catch (err) {
        setFlightData(null);
        toast.error('Flight instance not found');
      } finally {
        setLoading(false);
      }
    };

    fetchFlightInstance();
  }, [instanceId, searchParams]);

  const handleSeatSelect = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
      toast.success(`Removed seat ${seatNumber}`);
    } else {
      if (selectedSeats.length < totalPassengers) {
        // Add new seat
        setSelectedSeats([...selectedSeats, seatNumber]);
        toast.success(`Selected seat ${seatNumber} for Passenger ${selectedSeats.length + 1}`);
      } else {
        // Replace the last selected seat smoothly
        const replaced = selectedSeats[selectedSeats.length - 1];
        const updated = [...selectedSeats.slice(0, selectedSeats.length - 1), seatNumber];
        setSelectedSeats(updated);
        toast.success(`Replaced seat ${replaced} with ${seatNumber}`);
      }
    }
  };

  const removeSeat = (seatNumber) => {
    setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
  };

  const handleProceed = () => {
    if (selectedSeats.length < totalPassengers) {
      toast.error(`Please select ${totalPassengers - selectedSeats.length} more seat(s) for your ${totalPassengers} traveler(s)`);
      return;
    }

    // Navigate to passenger details with state
    navigate('/passenger-details', {
      state: {
        flight: flightData,
        selectedSeats,
        adults,
        children,
        totalPassengers
      }
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading flight and seat configuration..." className="min-h-[70vh]" />;
  }

  if (!flightData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Plane className="w-6 h-6 rotate-45" />
          </div>
          <h2 className="text-xl font-bold text-navy">Flight Not Found</h2>
          <p className="text-xs text-slate-500">
            No flight instance was found with the specified reference. Please search for an active scheduled departure.
          </p>
          <button
            onClick={() => navigate('/flights')}
            className="w-full py-3 px-4 bg-navy text-white text-xs font-bold rounded-xl hover:bg-skyblue transition cursor-pointer"
          >
            Back to Flight Search
          </button>
        </div>
      </div>
    );
  }

  const adultFare = Number(flightData.adultFare || flightData.baseFare || flightData.price || 3500);
  const childFare = flightData.childFare !== undefined ? Number(flightData.childFare) : Math.round(adultFare * 0.75);
  const totalBaseFare = adults * adultFare + children * childFare;
  const taxes = Math.round(totalBaseFare * 0.12);
  const grandTotal = totalBaseFare + taxes;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Search Results
        </button>

        {/* Flight Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-md">
                <Plane className="w-6 h-6 text-skyblue" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Flight #{flightData.flightNumber}
                </span>
                <h1 className="text-xl font-extrabold text-navy">
                  {flightData.airline} • {flightData.aircraft}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-skyblue-light text-skyblue border border-skyblue/20">
                Layout: {flightData.layoutType || '3-3 Standard'}
              </span>
              <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                Economy Class
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departure</p>
              <p className="text-2xl font-black text-navy">{flightData.departureTime}</p>
              <p className="text-sm font-bold text-slate-700">{flightData.origin}</p>
              <p className="text-xs text-slate-400">{flightData.date}</p>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs font-semibold text-slate-500 mb-1">{flightData.duration}</span>
              <div className="w-full max-w-[180px] flex items-center gap-1">
                <div className="h-0.5 flex-1 bg-slate-200"></div>
                <Plane className="w-4 h-4 text-skyblue rotate-90" />
                <div className="h-0.5 flex-1 bg-slate-200"></div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 mt-1 uppercase">Non-stop Flight</span>
            </div>

            <div className="space-y-1 text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arrival</p>
              <p className="text-2xl font-black text-navy">{flightData.arrivalTime}</p>
              <p className="text-sm font-bold text-slate-700">{flightData.destination}</p>
              <p className="text-xs text-slate-400">{flightData.date}</p>
            </div>
          </div>
        </div>

        {/* Passenger Count & Seat Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Seat Map (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Interactive Passenger Count Selector Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-base font-extrabold text-navy flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-navy text-white text-xs flex items-center justify-center font-bold">1</span>
                    Select Number of Passengers
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjust travelers count. You will choose a seat for each passenger below.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Adults Counter */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-navy block">Adults</span>
                      <span className="text-[10px] text-slate-400 font-medium block">Age 12+</span>
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                        className="w-7 h-7 rounded-lg bg-white shadow-2xs font-black text-navy text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-navy">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        disabled={adults + children >= 9}
                        className="w-7 h-7 rounded-lg bg-white shadow-2xs font-black text-navy text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children Counter */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-bold text-navy block">Children</span>
                      <span className="text-[10px] text-slate-400 font-medium block">Age 2-11</span>
                    </div>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                        className="w-7 h-7 rounded-lg bg-white shadow-2xs font-black text-navy text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-navy">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(6, children + 1))}
                        disabled={adults + children >= 9}
                        className="w-7 h-7 rounded-lg bg-white shadow-2xs font-black text-navy text-sm flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Seat Allocation Status Matrix */}
              <div className="pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Assigned Passenger Seats ({selectedSeats.length} / {totalPassengers} Selected):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {Array.from({ length: totalPassengers }).map((_, idx) => {
                    const isChild = idx >= adults;
                    const assignedSeat = selectedSeats[idx];
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                          assignedSeat
                            ? 'bg-sky-50/60 border-skyblue/40 text-navy'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-navy block">
                            Passenger {idx + 1} ({isChild ? 'Child' : 'Adult'})
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {assignedSeat ? `Reserved: Seat ${assignedSeat}` : 'Click map to choose seat'}
                          </span>
                        </div>

                        {assignedSeat ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-navy text-white font-mono font-bold text-xs">
                              {assignedSeat}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSeat(assignedSeat)}
                              className="text-rose-500 hover:text-rose-700 font-bold p-1 hover:bg-rose-100 rounded cursor-pointer"
                              title="Clear seat"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 font-medium text-[10px]">
                            Pending
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Seat Map */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <div className="mb-6 text-center">
                <h2 className="text-lg font-black text-navy">Interactive Seat Selection</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose <span className="font-bold text-navy">{totalPassengers} seat{totalPassengers > 1 ? 's' : ''}</span> for your travelers. Click on any green seat to reserve.
                </p>
              </div>

              <SeatMapComponent
                layoutType={flightData.layoutType || '3-3'}
                rowCount={flightData.rowCount || 12}
                seats={flightData.seats || []}
                selectedSeats={selectedSeats}
                onSeatSelect={handleSeatSelect}
                maxSelectable={totalPassengers}
              />
            </div>
          </div>

          {/* Fare & Passenger Summary Sidebar (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-base font-extrabold text-navy border-b border-slate-100 pb-3">
                Price Breakdown
              </h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Adult Fare ({adults} × ₹{Number(adultFare).toLocaleString('en-IN')})</span>
                  <span className="font-bold text-navy font-mono">₹{Number(adults * adultFare).toLocaleString('en-IN')}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Child Fare ({children} × ₹{Number(childFare).toLocaleString('en-IN')})</span>
                    <span className="font-bold text-navy font-mono">₹{Number(children * childFare).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Taxes & Airport Surcharges</span>
                  <span className="font-bold text-navy font-mono">₹{Number(taxes).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span>Seat Assignment</span>
                  <span>FREE</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Total Payable</span>
                  <span className="text-2xl font-black text-navy font-mono">₹{Number(grandTotal).toLocaleString('en-IN')}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {totalPassengers} Traveler{totalPassengers > 1 ? 's' : ''}
                </span>
              </div>

              {/* Selected seats list */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-navy mb-1.5 flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5 text-skyblue" /> Chosen Seats ({selectedSeats.length}/{totalPassengers}):
                </p>
                {selectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-navy text-white text-xs font-bold rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600">None selected yet. Please pick seats on the map.</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleProceed}
                disabled={selectedSeats.length < totalPassengers}
                className="w-full py-4 bg-navy hover:bg-skyblue text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue to Passenger Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
                <ShieldCheck className="w-4 h-4 text-skyblue" />
                <span>Zero cancellation fees within 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetails;
