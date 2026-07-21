import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import AddContactModal from './components/AddContactModal';
import NewBroadcastModal from './components/NewBroadcastModal';
import CreateTemplateModal from './components/CreateTemplateModal';
import {
  LayoutDashboard, Users, FileText, Send, Settings, LogOut,
  Plus, Search, Trash2, ChevronRight, MessageCircle,
  Clock, CheckCircle2, XCircle, Radio, Calendar,
  ArrowUpRight, Target, BarChart3
} from 'lucide-react';

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
  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const fetchContacts = () => { api.get('/contacts').then(r => setContacts(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };
  const fetchCampaigns = () => { api.get('/campaigns').then(r => setCampaigns(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };
  const fetchTemplates = () => { api.get('/templates').then(r => setTemplates(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };

  const deleteContact = async (id: string) => { if (!confirm('Remove this contact?')) return; try { await api.delete(`/contacts/${id}`); fetchContacts(); } catch {} };
  const deleteTemplate = async (id: string) => { if (!confirm('Delete this template?')) return; try { await api.delete(`/templates/${id}`); fetchTemplates(); } catch {} };

  useEffect(() => { fetchContacts(); fetchCampaigns(); fetchTemplates(); }, []);
  useEffect(() => {
    if (activeTab === 'contacts') fetchContacts();
    else if (activeTab === 'campaigns') fetchCampaigns();
    else if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)
  );
  const totalSent = campaigns.reduce((s, c) => s + (c.sentMessages || 0), 0);
  const totalFailed = campaigns.reduce((s, c) => s + (c.failedMessages || 0), 0);

  const nav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statusColor = (s: string) => {
    switch(s) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'running': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] text-gray-900 tracking-tight">WhatsApp CRM</span>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-0.5">
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
                <p className="text-sm text-gray-500 mt-0.5">Your WhatsApp CRM at a glance</p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Contacts', value: contacts.length, icon: Users, change: 'Total' },
                  { label: 'Templates', value: templates.length, icon: FileText, change: 'Ready' },
                  { label: 'Campaigns', value: campaigns.length, icon: Send, change: 'All time' },
                  { label: 'Messages Sent', value: totalSent, icon: CheckCircle2, change: totalFailed > 0 ? `${totalFailed} failed` : 'Across all campaigns' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-2xs text-gray-400 font-medium">{stat.change}</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Add contact', sub: 'Single or CSV import', action: () => setIsAddContactOpen(true), icon: Users },
                    { label: 'Create template', sub: 'With {{variables}}', action: () => setIsCreateTemplateOpen(true), icon: FileText },
                    { label: 'New broadcast', sub: 'Send or schedule', action: () => setIsNewBroadcastOpen(true), icon: Send },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all text-left group">
                      <div className="w-9 h-9 bg-gray-50 group-hover:bg-brand-50 rounded-lg flex items-center justify-center transition-colors">
                        <a.icon className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.label}</p>
                        <p className="text-xs text-gray-400">{a.sub}</p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent campaigns */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent campaigns</h3>
                  {campaigns.length > 0 && (
                    <button onClick={() => setActiveTab('campaigns')} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {campaigns.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No campaigns yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Create a broadcast to get started</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {campaigns.slice(0, 5).map(camp => (
                      <div key={camp.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${camp.status === 'completed' ? 'bg-emerald-500' : camp.status === 'running' ? 'bg-blue-500' : camp.status === 'scheduled' ? 'bg-violet-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{camp.name}</p>
                            <p className="text-xs text-gray-400">{camp.template?.name} · {new Date(camp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">{camp.sentMessages || 0} sent</span>
                          <span className={`text-2xs font-medium px-2 py-0.5 rounded-md border capitalize ${statusColor(camp.status)}`}>{camp.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{contacts.length} total contacts</p>
                </div>
                <button onClick={() => setIsAddContactOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add contact
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full md:w-72 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredContacts.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                        {contactSearch ? 'No contacts match your search' : 'No contacts yet. Click "Add contact" to start.'}
                      </td></tr>
                    ) : filteredContacts.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold">
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{c.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 font-mono text-xs">{c.phone}</td>
                        <td className="px-5 py-3">
                          <span className={`text-2xs font-medium px-2 py-0.5 rounded-md border capitalize ${
                            c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => deleteContact(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Reusable message templates with variable support</p>
                </div>
                <button onClick={() => setIsCreateTemplateOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> New template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">No templates yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first template to start sending personalized messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(tpl => {
                    const content = tpl.components?.[0]?.text || '';
                    const vars = tpl.components?.[0]?.variables || [];
                    return (
                      <div key={tpl.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-sm font-semibold text-gray-900">{tpl.name}</h3>
                              <span className="text-2xs text-gray-400 font-medium bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">{tpl.language}</span>
                            </div>
                            {content && (
                              <p className="text-sm text-gray-500 mt-2 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">{content}</p>
                            )}
                            {vars.length > 0 && (
                              <div className="flex gap-1.5 mt-2.5">
                                {vars.map((v: string) => (
                                  <span key={v} className="text-2xs font-mono font-medium bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded">{`{{${v}}}`}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteTemplate(tpl.id)}
                            className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-4">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} campaigns · {totalSent} messages sent</p>
                </div>
                <button onClick={() => setIsNewBroadcastOpen(true)}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> New broadcast
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">No campaigns yet</p>
                  <p className="text-xs text-gray-400 mt-1">Launch your first broadcast to start reaching contacts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(camp => {
                    const total = camp.totalMessages || 0;
                    const sent = camp.sentMessages || 0;
                    const failed = camp.failedMessages || 0;
                    const delivered = camp.deliveredCount || 0;
                    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

                    return (
                      <div key={camp.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-sm font-semibold text-gray-900">{camp.name}</h3>
                              <span className={`text-2xs font-medium px-2 py-0.5 rounded-md border capitalize ${statusColor(camp.status)}`}>{camp.status}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {camp.template?.name} · {camp.scheduledAt
                                ? `Scheduled for ${new Date(camp.scheduledAt).toLocaleString()}`
                                : new Date(camp.createdAt).toLocaleString()
                              }
                            </p>
                          </div>
                        </div>

                        {total > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Delivery progress</span>
                              <span className="font-medium text-gray-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                camp.status === 'failed' ? 'bg-red-500' : camp.status === 'completed' ? 'bg-emerald-500' : 'bg-brand-500'
                              }`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-gray-400" />{total} targeted</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{sent} sent</span>
                          {failed > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />{failed} failed</span>}
                          {delivered > 0 && <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-blue-500" />{delivered} delivered</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your WhatsApp Business API credentials</p>
              </div>

              <div className="max-w-lg space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">API Configuration</h3>
                  <p className="text-xs text-gray-400 mb-5">Connect your Meta Business credentials to enable message delivery.</p>

                  <div className="space-y-4">
                    {[
                      { label: 'Phone Number ID', placeholder: 'e.g. 102938475610293' },
                      { label: 'Access Token', placeholder: 'EAAx...', type: 'password' },
                      { label: 'WABA ID', placeholder: 'e.g. 1234567890' },
                      { label: 'Webhook Verify Token', placeholder: 'your_verify_token' },
                    ].map((field, i) => (
                      <div key={i}>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                        <input type={field.type || 'text'} placeholder={field.placeholder}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition" />
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Save credentials
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Account</h3>
                  <p className="text-xs text-gray-400 mb-3">Currently signed in as:</p>
                  <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 border border-gray-100">
                    <p className="text-sm text-gray-700 font-mono">admin@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} onSuccess={fetchContacts} />
      <NewBroadcastModal isOpen={isNewBroadcastOpen} onClose={() => setIsNewBroadcastOpen(false)} onSuccess={fetchCampaigns} />
      <CreateTemplateModal isOpen={isCreateTemplateOpen} onClose={() => setIsCreateTemplateOpen(false)} onSuccess={fetchTemplates} />
    </div>
  );
}

export default App;
