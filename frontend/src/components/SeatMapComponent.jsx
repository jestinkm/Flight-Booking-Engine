import React from 'react';
import { Armchair, Check, AlertCircle } from 'lucide-react';

const SeatMapComponent = ({
  layoutType = '3-3',
  rowCount = 12,
  seats = [],
  selectedSeats = [],
  onSeatSelect,
  maxSelectable = 1,
  readOnly = false
}) => {
  // Columns definition based on layout type
  const leftCols = layoutType === '2-2' ? ['A', 'B'] : ['A', 'B', 'C'];
  const rightCols = layoutType === '2-2' ? ['C', 'D'] : ['D', 'E', 'F'];
  const allCols = [...leftCols, ...rightCols];

  // Helper to get position type for a column in 3-3 or 2-2
  const getPositionType = (col) => {
    if (layoutType === '2-2') {
      if (col === 'A' || col === 'D') return 'WINDOW';
      return 'AISLE';
    }
    // 3-3
    if (col === 'A' || col === 'F') return 'WINDOW';
    if (col === 'C' || col === 'D') return 'AISLE';
    return 'MIDDLE';
  };

  // Build seat lookup map from provided seats or generate dynamic defaults
  const seatMap = new Map();
  if (Array.isArray(seats) && seats.length > 0) {
    seats.forEach((seat) => {
      const code = seat.seatNumber || `${seat.row}${seat.column || seat.seatLetter}`;
      seatMap.set(code, seat);
    });
  }

  // Generate row array
  const rows = Array.from({ length: rowCount }, (_, i) => i + 1);

  const getSeatStatus = (seatNumber, row, col) => {
    if (selectedSeats.includes(seatNumber)) {
      return 'SELECTED';
    }

    const seatData = seatMap.get(seatNumber);
    if (seatData) {
      if (seatData.status) return seatData.status.toUpperCase();
      if (seatData.isOccupied || seatData.isAssigned) return 'OCCUPIED';
      if (seatData.isBlocked) return 'BLOCKED';
      return 'AVAILABLE';
    }

    // If backend seats were provided, unlisted seats default to AVAILABLE
    if (seatMap.size > 0) {
      return 'AVAILABLE';
    }

    // Fallback only if no seats data was passed at all
    return 'AVAILABLE';
  };

  const handleSeatClick = (seatNumber, status) => {
    if (readOnly) return;
    if (status === 'OCCUPIED' || status === 'ASSIGNED' || status === 'BLOCKED') return;

    if (onSeatSelect) {
      onSeatSelect(seatNumber);
    }
  };

  const renderSeat = (row, col) => {
    const seatNumber = `${row}${col}`;
    const status = getSeatStatus(seatNumber, row, col);
    const position = getPositionType(col);
    const isSelected = status === 'SELECTED';
    const isOccupied = status === 'OCCUPIED' || status === 'ASSIGNED';
    const isBlocked = status === 'BLOCKED';

    let colorStyles = 'bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-xs';
    if (isSelected) {
      colorStyles = 'bg-skyblue border-skyblue text-white shadow-md scale-105 font-bold cursor-pointer';
    } else if (isOccupied) {
      colorStyles = 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed';
    } else if (isBlocked) {
      colorStyles = 'bg-rose-100 border-rose-300 text-rose-400 cursor-not-allowed';
    }

    return (
      <button
        key={seatNumber}
        type="button"
        disabled={isOccupied || isBlocked || readOnly}
        onClick={() => handleSeatClick(seatNumber, status)}
        title={`Seat ${seatNumber} (${position}) - ${status}`}
        className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-150 text-xs ${colorStyles}`}
      >
        <span className="font-semibold text-[11px] leading-none">{col}</span>
        {isSelected ? (
          <Check className="w-3 h-3 text-white mt-0.5" />
        ) : (
          <span className="text-[8px] opacity-70 leading-none mt-0.5">
            {position[0]}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm max-w-2xl mx-auto">
      {/* Plane Nose Indicator */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="w-32 h-10 border-t-2 border-x-2 border-slate-300 rounded-t-full flex items-center justify-center bg-slate-50 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
          Cockpit / Front
        </div>
        <div className="w-full max-w-sm h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2"></div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-3 text-xs font-bold text-slate-400">
        <div className="flex gap-2 sm:gap-3">
          {leftCols.map((c) => (
            <div key={c} className="w-8 sm:w-10 text-center font-mono">
              {c}
            </div>
          ))}
        </div>

        <div className="w-8 text-center text-[10px] uppercase font-bold text-slate-300 tracking-wider">
          Aisle
        </div>

        <div className="flex gap-2 sm:gap-3">
          {rightCols.map((c) => (
            <div key={c} className="w-8 sm:w-10 text-center font-mono">
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* Seat Rows Grid */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto px-2 py-1">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Left Block */}
            <div className="flex gap-2 sm:gap-3">
              {leftCols.map((col) => renderSeat(row, col))}
            </div>

            {/* Aisle & Row Number */}
            <div className="w-8 flex items-center justify-center text-xs font-extrabold text-slate-400 font-mono">
              {row}
            </div>

            {/* Right Block */}
            <div className="flex gap-2 sm:gap-3">
              {rightCols.map((col) => renderSeat(row, col))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-white"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-skyblue"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400">W</span>
          <span>Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400">A</span>
          <span>Aisle</span>
        </div>
        {layoutType === '3-3' && (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400">M</span>
            <span>Middle</span>
          </div>
        )}
      </div>

      {/* Selection Status Summary */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 font-medium">Selected Seats: </span>
          <span className="text-sm font-bold text-navy">
            {selectedSeats.length} of {maxSelectable} required
          </span>
          {selectedSeats.length < maxSelectable && (
            <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" /> Please pick {maxSelectable - selectedSeats.length} more seat{maxSelectable - selectedSeats.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {selectedSeats.length > 0 ? (
            selectedSeats.map((seat) => (
              <span
                key={seat}
                className="px-2.5 py-1 rounded-lg bg-navy text-white text-xs font-bold shadow-xs"
              >
                Seat {seat}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No seat selected yet</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatMapComponent;
