import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { User, Role } from '../../types/index.ts';
import { formatKhmerDate, toKhmerDigits } from '../../lib/khmer-date.ts';
import {
  Users,
  KeyRound,
  Clock,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Shield,
} from 'lucide-react';

export const StaffModule: React.FC = () => {
  const {
    allStaff,
    currentStaff,
    loginWithPin,
    clockIn,
    clockOut,
    currentShiftId,
    useKhmerDigits,
    language,
    showToast,
  } = useRestaurant();

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CASHIER':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'WAITER':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'KITCHEN':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div id="staff-screen" className="flex flex-col h-[calc(100vh-100px)] bg-[#0E1013] text-[#F3F4F6] overflow-hidden">
      {/* Header with Active Shift Indicator */}
      <div className="p-4 bg-[#171A1F] border-b border-[#262A31] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#E0913A]" />
          <h2 className="text-base font-bold text-white">
            {language === 'km' ? 'គ្រប់គ្រងបុគ្គលិក & វេនការងារ (Staff & Shifts)' : 'Staff Management'}
          </h2>
        </div>

        {currentStaff && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              បុគ្គលិកបច្ចុប្បន្ន: <strong className="text-white">{currentStaff.name}</strong>
            </span>
            <button
              onClick={currentShiftId ? clockOut : clockIn}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                currentShiftId
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{currentShiftId ? 'បញ្ចប់វេន (Clock Out)' : 'ចូលវេន (Clock In)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Staff Cards Grid */}
      <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 scrollbar-thin">
        {allStaff.map((staff) => {
          const isMe = currentStaff?.id === staff.id;
          return (
            <div
              key={staff.id}
              className={`p-4 rounded-2xl bg-[#171A1F] border transition-all flex flex-col justify-between ${
                isMe ? 'border-[#E0913A] shadow-lg shadow-amber-900/20' : 'border-[#262A31]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{staff.name}</span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          បច្ចុប្បន្ន
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-gray-400">{staff.email || 'បុគ្គលិកភោជនីយដ្ឋាន'}</div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadge(
                      staff.role
                    )}`}
                  >
                    {staff.role}
                  </span>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-[#20242B] border border-[#262A31] space-y-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>លេខកូដសម្ងាត់ PIN:</span>
                    <span className="font-mono text-white">•••• (មានកូដ)</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>ទូរស័ព្ទ:</span>
                    <span className="text-white">{staff.phone || '012 xxx xxx'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#262A31] flex gap-2">
                <button
                  onClick={() => {
                    if (staff.pinCode) {
                      loginWithPin(staff.pinCode);
                    }
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#20242B] hover:bg-[#2A2E37] text-white text-xs font-bold border border-[#262A31] flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#E0913A]" />
                  <span>ប្តូរមកគណនីនេះ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
