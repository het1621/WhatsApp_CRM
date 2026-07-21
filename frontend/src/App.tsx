import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import AddContactModal from './components/AddContactModal';
import NewBroadcastModal from './components/NewBroadcastModal';
import CreateTemplateModal from './components/CreateTemplateModal';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchContacts = () => {
    api.get('/contacts').then(res => setContacts(res.data)).catch(err => { if (err.response?.status === 401) handleLogout(); });
  };
  const fetchCampaigns = () => {
    api.get('/campaigns').then(res => setCampaigns(res.data)).catch(err => { if (err.response?.status === 401) handleLogout(); });
  };
  const fetchTemplates = () => {
    api.get('/templates').then(res => setTemplates(res.data)).catch(err => { if (err.response?.status === 401) handleLogout(); });
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchContacts();
    } catch (err) { console.error(err); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchContacts();
    fetchCampaigns();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') fetchContacts();
    else if (activeTab === 'campaigns') fetchCampaigns();
    else if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.phone.includes(contactSearch)
  );

  const totalSent = campaigns.reduce((sum, c) => sum + (c.sentMessages || 0), 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + (c.failedMessages || 0), 0);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'contacts', label: 'Contacts', icon: '👥', badge: contacts.length },
    { id: 'templates', label: 'Templates', icon: '📄', badge: templates.length },
    { id: 'campaigns', label: 'Campaigns', icon: '🚀', badge: campaigns.length },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      {/* ——— Sidebar ——— */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-700/50 flex flex-col">
        {/* Brand */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">WhatsApp CRM</h1>
              <p className="text-xs text-slate-500">Broadcast Platform</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span>🚪</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ——— Main Content ——— */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <p className="text-slate-400 mt-1">Overview of your WhatsApp CRM performance</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{contacts.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Contacts</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">📄</span>
                    <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">Ready</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{templates.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Templates</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🚀</span>
                    <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg">Campaigns</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{campaigns.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Campaigns</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">✉️</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">Sent</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400">{totalSent}</p>
                  <p className="text-xs text-slate-500 mt-1">Messages Sent</p>
                  {totalFailed > 0 && (
                    <p className="text-xs text-red-400 mt-1">{totalFailed} failed</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setIsAddContactOpen(true)}
                    className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 hover:border-emerald-500/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <span className="text-2xl">➕</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Add Contact</p>
                      <p className="text-xs text-slate-500">Single or bulk CSV import</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsCreateTemplateOpen(true)}
                    className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 hover:border-cyan-500/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <span className="text-2xl">📝</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Create Template</p>
                      <p className="text-xs text-slate-500">With {"{{variable}}"} support</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsNewBroadcastOpen(true)}
                    className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 hover:border-violet-500/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <span className="text-2xl">📡</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">New Broadcast</p>
                      <p className="text-xs text-slate-500">Send now or schedule later</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Campaigns</h3>
                {campaigns.length === 0 ? (
                  <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-8 text-center">
                    <p className="text-slate-500">No campaigns yet. Create your first broadcast!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.slice(0, 5).map(camp => (
                      <div key={camp.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/70 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            camp.status === 'completed' ? 'bg-emerald-400' :
                            camp.status === 'running' ? 'bg-blue-400 animate-pulse-dot' :
                            camp.status === 'scheduled' ? 'bg-purple-400' :
                            camp.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                          }`} />
                          <div>
                            <p className="font-medium text-white text-sm">{camp.name}</p>
                            <p className="text-xs text-slate-500">{camp.template?.name} • {new Date(camp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-emerald-400 font-semibold">✅ {camp.sentMessages}</span>
                          {camp.failedMessages > 0 && <span className="text-red-400 font-semibold">❌ {camp.failedMessages}</span>}
                          <span className={`px-2.5 py-1 rounded-lg font-semibold capitalize ${
                            camp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            camp.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                            camp.status === 'scheduled' ? 'bg-purple-500/10 text-purple-400' :
                            camp.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>{camp.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== CONTACTS ===== */}
          {activeTab === 'contacts' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Contacts</h2>
                  <p className="text-slate-400 text-sm mt-1">{contacts.length} contacts in your database</p>
                </div>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <span>+</span> Add Contact
                </button>
              </div>

              {/* Search */}
              <div className="mb-5">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full md:w-80 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                />
              </div>

              <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 border-b border-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredContacts.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        {contactSearch ? 'No contacts match your search.' : 'No contacts yet. Click "Add Contact" to get started.'}
                      </td></tr>
                    ) : filteredContacts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 text-sm font-bold">
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-white">{c.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">{c.phone}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg capitalize ${
                            c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => deleteContact(c.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== TEMPLATES ===== */}
          {activeTab === 'templates' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Templates</h2>
                  <p className="text-slate-400 text-sm mt-1">Create reusable message templates with {"{{variables}}"}</p>
                </div>
                <button
                  onClick={() => setIsCreateTemplateOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <span>+</span> Create Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="bg-slate-800/30 border border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
                  <span className="text-5xl mb-4 block">📄</span>
                  <p className="text-slate-400 mb-2">No templates yet</p>
                  <p className="text-sm text-slate-500">Create your first template to start sending personalized messages</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map(tpl => {
                    const content = tpl.components?.[0]?.text || '';
                    const vars = tpl.components?.[0]?.variables || [];
                    return (
                      <div key={tpl.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/70 transition-colors group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">{tpl.name}</h3>
                              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-medium">{tpl.language}</span>
                            </div>
                            {/* Template content preview */}
                            <div className="bg-slate-900/50 rounded-xl p-4 mt-3 border border-slate-700/30">
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {content || <span className="text-slate-500 italic">No content</span>}
                              </p>
                            </div>
                            {vars.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {vars.map((v: string) => (
                                  <span key={v} className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg font-mono">
                                    {`{{${v}}}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteTemplate(tpl.id)}
                            className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all ml-4"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== CAMPAIGNS ===== */}
          {activeTab === 'campaigns' && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Campaigns</h2>
                  <p className="text-slate-400 text-sm mt-1">{campaigns.length} campaigns • {totalSent} messages sent</p>
                </div>
                <button
                  onClick={() => setIsNewBroadcastOpen(true)}
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20 flex items-center gap-2"
                >
                  🚀 New Broadcast
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-slate-800/30 border border-dashed border-slate-600/50 rounded-2xl p-12 text-center">
                  <span className="text-5xl mb-4 block">🚀</span>
                  <p className="text-slate-400 mb-2">No campaigns yet</p>
                  <p className="text-sm text-slate-500">Create your first broadcast to reach your contacts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(camp => {
                    const total = camp.totalMessages || 0;
                    const sent = camp.sentMessages || 0;
                    const failed = camp.failedMessages || 0;
                    const delivered = camp.deliveredCount || 0;
                    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

                    return (
                      <div key={camp.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/70 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                camp.status === 'completed' ? 'bg-emerald-400' :
                                camp.status === 'running' ? 'bg-blue-400 animate-pulse-dot' :
                                camp.status === 'scheduled' ? 'bg-purple-400 animate-pulse-dot' :
                                camp.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                              }`} />
                              <h3 className="font-semibold text-white">{camp.name}</h3>
                              <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold capitalize ${
                                camp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                camp.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                                camp.status === 'scheduled' ? 'bg-purple-500/10 text-purple-400' :
                                camp.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                'bg-yellow-500/10 text-yellow-400'
                              }`}>{camp.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Template: {camp.template?.name || 'N/A'} • {camp.scheduledAt
                                ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString()}`
                                : new Date(camp.createdAt).toLocaleString()
                              }
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {total > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  camp.status === 'failed' ? 'bg-red-500' :
                                  camp.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stats row */}
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">🎯</span>
                            <span className="text-slate-400"><b className="text-white">{total}</b> targeted</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-400">✅</span>
                            <span className="text-slate-400"><b className="text-emerald-400">{sent}</b> sent</span>
                          </div>
                          {failed > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-red-400">❌</span>
                              <span className="text-slate-400"><b className="text-red-400">{failed}</b> failed</span>
                            </div>
                          )}
                          {delivered > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-400">📬</span>
                              <span className="text-slate-400"><b className="text-blue-400">{delivered}</b> delivered</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <p className="text-slate-400 text-sm mt-1">Configure your WhatsApp Business API credentials</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-1">WhatsApp Business API</h3>
                  <p className="text-xs text-slate-500 mb-5">Enter your Meta for Developers credentials to enable message sending.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number ID</label>
                      <input type="text" placeholder="e.g. 102938475610293" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Access Token</label>
                      <input type="password" placeholder="EAAx..." className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">WABA ID</label>
                      <input type="text" placeholder="e.g. 1234567890" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Webhook Verify Token</label>
                      <input type="text" placeholder="your_secure_token" className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" />
                    </div>
                  </div>

                  <button className="mt-6 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20">
                    Save Credentials
                  </button>
                  <p className="text-xs text-slate-500 mt-3">🔒 Credentials are stored securely per-user and never shared across tenants.</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-1">Account Info</h3>
                  <p className="text-xs text-slate-500 mb-4">Your login details</p>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                    <p className="text-sm text-slate-300">Logged in as: <span className="text-emerald-400 font-mono">admin@example.com</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} onSuccess={fetchContacts} />
      <NewBroadcastModal isOpen={isNewBroadcastOpen} onClose={() => setIsNewBroadcastOpen(false)} onSuccess={fetchCampaigns} />
      <CreateTemplateModal isOpen={isCreateTemplateOpen} onClose={() => setIsCreateTemplateOpen(false)} onSuccess={fetchTemplates} />
    </div>
  );
}

export default App;
