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
  
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const fetchContacts = () => {
    api.get('/contacts')
      .then(res => setContacts(res.data))
      .catch(err => {
        if (err.response?.status === 401) handleLogout();
      });
  };

  const fetchCampaigns = () => {
    api.get('/campaigns')
      .then(res => setCampaigns(res.data))
      .catch(err => {
        if (err.response?.status === 401) handleLogout();
      });
  };

  const fetchTemplates = () => {
    api.get('/templates')
      .then(res => setTemplates(res.data))
      .catch(err => {
        if (err.response?.status === 401) handleLogout();
      });
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchContacts();
      fetchCampaigns();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    } else if (activeTab === 'campaigns') {
      fetchCampaigns();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen relative p-8 bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] overflow-x-hidden">
      {/* Background decoration elements for glassmorphism pop */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-whatsapp-light/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
              WhatsApp <span className="text-whatsapp-dark">CRM</span>
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Broadcast & Manage Connections Seamlessly.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 font-medium px-4 py-2 bg-white/40 rounded-xl hover:bg-white/60 transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-3xl p-6 flex flex-col space-y-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${activeTab === 'dashboard' ? 'bg-white/60 shadow-sm text-whatsapp-darker' : 'text-gray-600 hover:bg-white/40'}`}
              >
                📊 Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('contacts')}
                className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${activeTab === 'contacts' ? 'bg-white/60 shadow-sm text-whatsapp-darker' : 'text-gray-600 hover:bg-white/40'}`}
              >
                👥 Contacts
              </button>
              <button 
                onClick={() => setActiveTab('templates')}
                className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${activeTab === 'templates' ? 'bg-white/60 shadow-sm text-whatsapp-darker' : 'text-gray-600 hover:bg-white/40'}`}
              >
                📄 Templates
              </button>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 font-medium ${activeTab === 'campaigns' ? 'bg-white/60 shadow-sm text-whatsapp-darker' : 'text-gray-600 hover:bg-white/40'}`}
              >
                🚀 Campaigns
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="glass rounded-3xl p-8 min-h-[600px] transition-all">
              {activeTab === 'dashboard' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Contacts</p>
                      <h3 className="text-4xl font-black text-gray-800 mt-2">{contacts.length}</h3>
                      <p className="text-sm text-whatsapp-dark mt-2 font-medium">In your database</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Campaigns</p>
                      <h3 className="text-4xl font-black text-gray-800 mt-2">{campaigns.length}</h3>
                      <p className="text-sm text-whatsapp-dark mt-2 font-medium">Running or completed</p>
                    </div>
                    <div className="bg-gradient-to-br from-whatsapp-light to-whatsapp-darker text-white rounded-2xl p-6 shadow-lg shadow-whatsapp-light/30">
                      <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">Total Sent</p>
                      <h3 className="text-4xl font-black mt-2">
                        {campaigns.reduce((sum, camp) => sum + camp.sentMessages, 0)}
                      </h3>
                      <p className="text-sm text-white/90 mt-2 font-medium">Messages delivered</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Contact Management</h2>
                    <button 
                      onClick={() => setIsAddContactOpen(true)}
                      className="bg-whatsapp-dark hover:bg-whatsapp-darker text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-whatsapp-dark/20"
                    >
                      + Add Contact
                    </button>
                  </div>
                  <div className="bg-white/40 rounded-2xl border border-white/50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/40 border-b border-white/50">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Phone Number</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                              No contacts found. Click "Add Contact" to start.
                            </td>
                          </tr>
                        ) : (
                          contacts.map((contact) => (
                            <tr key={contact.id} className="border-b border-white/30 hover:bg-white/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-800">{contact.name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-gray-600">{contact.phone}</td>
                              <td className="px-6 py-4">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold capitalize">
                                  {contact.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Templates</h2>
                    <button 
                      onClick={() => setIsCreateTemplateOpen(true)}
                      className="bg-whatsapp-dark hover:bg-whatsapp-darker text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-whatsapp-dark/20"
                    >
                      + Create Template
                    </button>
                  </div>
                  
                  <div className="bg-white/40 rounded-2xl border border-white/50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/40 border-b border-white/50">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Variables</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Content Snippet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                              No templates yet. Create one to send personalized messages!
                            </td>
                          </tr>
                        ) : (
                          templates.map((tpl) => (
                            <tr key={tpl.id} className="border-b border-white/30 hover:bg-white/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-800">{tpl.name}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {tpl.components[0]?.variables?.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {tpl.components[0].variables.map((v: string) => (
                                      <span key={v} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">
                                        {`{{${v}}}`}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">None</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm truncate max-w-[250px]">
                                {tpl.components[0]?.text}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Campaigns</h2>
                    <button 
                      onClick={() => setIsNewBroadcastOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-indigo-500/30 transform hover:scale-105"
                    >
                      🚀 New Broadcast
                    </button>
                  </div>
                  
                  <div className="bg-white/40 rounded-2xl border border-white/50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/40 border-b border-white/50">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Campaign Name</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stats</th>
                          <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date/Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                              No active campaigns. Start a new broadcast to reach your contacts!
                            </td>
                          </tr>
                        ) : (
                          campaigns.map((camp) => (
                            <tr key={camp.id} className="border-b border-white/30 hover:bg-white/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-800">
                                {camp.name}
                                <div className="text-xs text-gray-500 mt-1">{camp.template?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                  camp.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  camp.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                  camp.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                                  camp.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {camp.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-4 text-sm">
                                  <div className="text-gray-600" title="Total targeted">
                                    🎯 {camp.totalMessages}
                                  </div>
                                  <div className="text-green-600" title="Sent successfully">
                                    ✅ {camp.sentMessages}
                                  </div>
                                  <div className="text-red-500" title="Failed to send">
                                    ❌ {camp.failedMessages}
                                  </div>
                                  {(camp.deliveredCount > 0 || camp.failedCount > 0) && (
                                    <div className="text-blue-600 font-bold ml-2" title="Actual delivery confirmed via Meta webhook">
                                      {camp.deliveredCount}/{camp.sentMessages} Delivered
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-sm">
                                {camp.scheduledAt ? (
                                  <span className="text-purple-600 font-medium">
                                    Scheduled: {new Date(camp.scheduledAt).toLocaleString()}
                                  </span>
                                ) : (
                                  new Date(camp.createdAt).toLocaleString()
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)} 
        onSuccess={fetchContacts} 
      />
      <NewBroadcastModal 
        isOpen={isNewBroadcastOpen} 
        onClose={() => setIsNewBroadcastOpen(false)} 
        onSuccess={fetchCampaigns} 
      />
      <CreateTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  );
}

export default App;
