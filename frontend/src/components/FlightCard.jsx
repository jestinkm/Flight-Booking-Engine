import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Clock, Shield, Armchair, ChevronRight } from 'lucide-react';

const FlightCard = ({ flight, searchParams = {} }) => {
  const navigate = useNavigate();

  // Extract flight fields safely with robust defaults
  const flightId = flight._id || flight.id || flight.flightInstanceId;
  const flightNumber = flight.flightNumber || flight.flightCode || (flight.flightId?.flightNumber) || (flight.flight?.flightNumber) || 'SK-101';
  const flightName = flight.flightName || flight.flightId?.flightName || (flight.flight?.flightName) || '';
  const airline = flight.airline || 'Skynexa Airways';
  const aircraft = flight.aircraft || flight.aircraftType || flight.flightId?.aircraftLayoutId?.name || (flight.flight?.aircraft) || 'Airbus A320neo';

  const originCode = flight.origin?.code || flight.originCode || flight.origin || 'DEL';
  const originCity = flight.origin?.city || flight.originCity || originCode;
  
  const destCode = flight.destination?.code || flight.destinationCode || flight.destination || 'BOM';
  const destCity = flight.destination?.city || flight.destinationCity || destCode;

  const departureTime = flight.departureTime || flight.departure || '08:00 AM';
  const arrivalTime = flight.arrivalTime || flight.arrival || '11:30 AM';
  const duration = flight.duration || '2h 15m';
  const stops = flight.stops !== undefined ? flight.stops : 0;

  const adultFare = flight.adultFare || flight.baseFare || flight.price || 3500;
  const childFare = flight.childFare || Math.round(adultFare * 0.75);
  const availableSeats = flight.availableSeats !== undefined ? flight.availableSeats : (flight.capacity || 0);

  const handleSelect = () => {
    const params = new URLSearchParams(searchParams).toString();
    navigate(`/flights/${flightId}${params ? `?${params}` : ''}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 hover:border-skyblue/60 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 group">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Airline & Route Info */}
        <div className="flex-1 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-navy/5 flex items-center justify-center text-navy font-bold text-xs group-hover:bg-skyblue/15 group-hover:scale-110 transition-all duration-300">
                <Plane className="w-4 h-4 text-skyblue transition-transform duration-300 group-hover:-rotate-12" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-navy text-sm group-hover:text-skyblue transition-colors duration-300">{airline}</span>
                  {flightName && (
                    <span className="text-xs font-semibold text-slate-500">({flightName})</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{flightNumber}</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full transition-colors group-hover:bg-sky-50 group-hover:text-skyblue">
              {aircraft}
            </span>
          </div>

          {/* Timeline Details */}
          <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 pt-1">
            {/* Origin */}
            <div className="col-span-2 text-left">
              <p className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">{departureTime}</p>
              <p className="text-sm font-bold text-slate-700">{originCode}</p>
              <p className="text-xs text-slate-400 truncate">{originCity}</p>
            </div>

            {/* Flight Path Graphic with Hover Motion */}
            <div className="col-span-3 flex flex-col items-center justify-center">
              <span className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {duration}
              </span>
              <div className="w-full flex items-center gap-1.5 px-1">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 via-sky-300 to-slate-200 rounded-full group-hover:via-skyblue transition-colors duration-300"></div>
                <Plane className="w-4 h-4 text-skyblue rotate-90 transform shrink-0 group-hover:translate-x-2 transition-transform duration-500 ease-out" />
                <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 via-sky-300 to-slate-200 rounded-full group-hover:via-skyblue transition-colors duration-300"></div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 mt-1 uppercase tracking-wide">
                {stops === 0 ? 'Direct Non-stop' : `${stops} Stop${stops > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Destination */}
            <div className="col-span-2 text-right">
              <p className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">{arrivalTime}</p>
              <p className="text-sm font-bold text-slate-700">{destCode}</p>
              <p className="text-xs text-slate-400 truncate">{destCity}</p>
            </div>
          </div>

          {/* Badges / Extras */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5 text-slate-400" />
              Standard Baggage Included
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Free Cancellation within 24h
            </span>
            <span className="ml-auto text-xs font-semibold text-slate-500">
              {availableSeats > 0 ? (
                <span className={availableSeats < 10 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                  {availableSeats} seats left
                </span>
              ) : (
                <span className="text-rose-600 font-bold">Sold Out</span>
              )}
            </span>
          </div>
        </div>

        {/* Right: Pricing & CTA */}
        <div className="lg:w-48 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between items-end border-t lg:border-t-0 pt-4 lg:pt-0">
          <div className="text-right w-full">
            <p className="text-xs text-slate-400 font-medium">Starting from</p>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-sm font-bold text-slate-500">₹</span>
              <span className="text-3xl font-extrabold text-navy group-hover:text-skyblue transition-colors duration-300">{Number(adultFare).toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Child fare: ₹{Number(childFare).toLocaleString('en-IN')}
            </p>
          </div>

          <button
            onClick={handleSelect}
            disabled={availableSeats <= 0}
            className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-sm bg-navy text-white hover:bg-skyblue transition-all shadow-sm hover:shadow-lg hover:shadow-sky-400/25 active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer duration-200"
          >
            <span>Select Flight</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
