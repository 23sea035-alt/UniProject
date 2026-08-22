'use client';

import React, { useState } from 'react';
import {
  BellRing,
  Send,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Search,
  Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function NotificationsPage() {
  const { notifications, users, sendCustomNotification } = useData();

  const [search, setSearch] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('Scheduled Water Supply Maintenance Notice');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Please be informed that water supply will be temporarily interrupted on Saturday from 08:00 to 14:00 due to main distribution pipe maintenance.'
  );
  const [targetDistrict, setTargetDistrict] = useState('ALL');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const filteredNotifications = notifications.filter(
    (n) =>
      n.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      n.recipientPhone.includes(search) ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsSending(true);
    const targetUsers = targetDistrict === 'ALL' ? users : users.filter((u) => u.district === targetDistrict);

    for (const u of targetUsers) {
      await sendCustomNotification({
        customerId: u.id,
        title: broadcastTitle,
        message: broadcastMessage,
        channel: 'BOTH',
      });
    }

    setIsSending(false);
    setIsBroadcastModalOpen(false);
    setFeedback(`Broadcast successfully sent to ${targetUsers.length} water consumers via SMS & Push notifications!`);
    setTimeout(() => setFeedback(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-400" />
            <span>National Notification Center & Telco SMS Hub</span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-channel consumer communications via Dialog Axiata / Mobitel SMS Gateway and Firebase Push
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast Public Announcement</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Gateway Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Dialog Axiata Gov SMS Gateway</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-1 font-mono">CONNECTED</p>
          <p className="text-[11px] text-emerald-400 mt-1">99.8% Delivery Rate</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Firebase Cloud Messaging (FCM)</span>
            <Smartphone className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-slate-100 mt-1 font-mono">ONLINE</p>
          <p className="text-[11px] text-teal-400 mt-1">React Native Mobile App Active</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Dispatches Recorded</span>
            <BellRing className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">{notifications.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Audit compliant messaging logs</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notification messages, recipient name, phone numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Notification Logs List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Recipient Consumer</th>
                <th className="p-3.5">Channel & Type</th>
                <th className="p-3.5">Message Content</th>
                <th className="p-3.5">Gateway Provider</th>
                <th className="p-3.5">Sent Timestamp</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredNotifications.map((notif) => (
                <tr key={notif.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-100">{notif.recipientName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{notif.recipientPhone}</p>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {notif.channel === 'SMS' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      ) : notif.channel === 'PUSH' ? (
                        <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          <Smartphone className="w-3 h-3 text-teal-400" />
                        </div>
                      )}
                      <span className="font-semibold text-slate-200">{notif.type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>

                  <td className="p-3.5 max-w-md">
                    <p className="font-bold text-slate-200">{notif.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{notif.message}</p>
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-slate-400">
                    {notif.gatewayProvider}
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(notif.sentTimestamp).toLocaleString('en-GB')}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">
                      {notif.deliveryStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Announcement Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Broadcast Official Island-Wide / Regional Announcement</span>
            </h3>

            <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target District / Regional Scheme</label>
                <select
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                >
                  <option value="ALL">All Island-Wide Consumers ({users.length})</option>
                  <option value="Colombo">Colombo District</option>
                  <option value="Kandy">Kandy District</option>
                  <option value="Galle">Galle District</option>
                  <option value="Jaffna">Jaffna District</option>
                  <option value="Gampaha">Gampaha District</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notice Heading</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Message Body</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40 flex items-center gap-1.5"
                >
                  {isSending ? 'Transmitting...' : 'Dispatch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
